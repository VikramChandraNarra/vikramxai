import { Story, Tweet } from './types';
import { CACHE_TTL_MS } from './config';
import { redis } from './redis';

// ─── Redis keys ──────────────────────────────────────────────────────────────

const STORIES_KEY = 'stories';
const META_KEY = 'cache:meta';
const TWEETS_KEY = 'tweets:raw';

const TTL_SECONDS = Math.ceil(CACHE_TTL_MS / 1000);

// ─── In-memory state ─────────────────────────────────────────────────────────
// isRefreshing is a per-process mutex — not shared across instances, no need
// to persist it to Redis.

interface InMemoryState {
  isRefreshing: boolean;
}

export const cache: InMemoryState = { isRefreshing: false };

// ─── Metadata (durable) ──────────────────────────────────────────────────────

export interface CacheMeta {
  lastRunAt: string | null;
  lastSuccessfulRunAt: string | null;
  error: string | null;
  updatedAt: string | null;
}

const EMPTY_META: CacheMeta = {
  lastRunAt: null,
  lastSuccessfulRunAt: null,
  error: null,
  updatedAt: null,
};

export async function getCacheMeta(): Promise<CacheMeta> {
  const meta = await redis.get<CacheMeta>(META_KEY);
  return meta ?? EMPTY_META;
}

export async function setCacheMeta(updates: Partial<CacheMeta>): Promise<void> {
  const current = await getCacheMeta();
  await redis.set(META_KEY, { ...current, ...updates });
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export async function getStories(): Promise<Story[]> {
  const stored = await redis.get<Story[]>(STORIES_KEY);
  return stored ?? [];
}

// Stores stories with a TTL matching CACHE_TTL_MS. When the key expires Redis
// drops it automatically, so isCacheValid() returns false on the next request.
export async function setStories(stories: Story[]): Promise<void> {
  const now = new Date().toISOString();
  await redis.set(STORIES_KEY, stories, { ex: TTL_SECONDS });
  await setCacheMeta({ updatedAt: now });
}

// Cache is valid as long as the stories key exists in Redis (TTL still alive).
export async function isCacheValid(): Promise<boolean> {
  const exists = await redis.exists(STORIES_KEY);
  return exists === 1;
}

export async function getCacheAgeMs(): Promise<number | null> {
  const meta = await getCacheMeta();
  if (!meta.updatedAt) return null;
  return Date.now() - new Date(meta.updatedAt).getTime();
}

// ─── Raw tweet cache (ingest fallback) ───────────────────────────────────────
// Stored without TTL so the pipeline can fall back to it when the X API fails.
// Date objects are serialised as ISO strings by Redis; re-hydrated on read.

export async function getRawTweets(): Promise<Tweet[] | null> {
  // Redis returns dates as strings; restore createdAt to Date objects.
  const stored = await redis.get<Array<Omit<Tweet, 'createdAt'> & { createdAt: string }>>(TWEETS_KEY);
  if (!stored) return null;
  return stored.map((t) => ({ ...t, createdAt: new Date(t.createdAt) }));
}

export async function setRawTweets(tweets: Tweet[]): Promise<void> {
  await redis.set(TWEETS_KEY, tweets);
}

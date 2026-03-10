import { Story } from './types';

interface CacheState {
  stories: Story[];
  lastRunAt: Date | null;
  lastSuccessfulRunAt: Date | null;
  isRefreshing: boolean;
  error: string | null;
  updatedAt: Date | null;
}

const g = globalThis as { __storyCache?: CacheState };
if (!g.__storyCache) {
  g.__storyCache = {
    stories: [],
    lastRunAt: null,
    lastSuccessfulRunAt: null,
    isRefreshing: false,
    error: null,
    updatedAt: null,
  };
}

export const cache = g.__storyCache;

export function getStories(): Story[] {
  return cache.stories;
}

export function setStories(stories: Story[]): void {
  cache.stories = stories;
  cache.updatedAt = new Date();
}

export function getCacheAgeMs(): number | null {
  if (!cache.updatedAt) return null;
  return Date.now() - cache.updatedAt.getTime();
}

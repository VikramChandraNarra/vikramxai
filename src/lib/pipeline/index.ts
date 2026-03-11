import {
  cache,
  setStories,
  setCacheMeta,
  getRawTweets,
  setRawTweets,
  areTweetsStale,
  hasStories,
} from '../cache';
import {
  PIPELINE_REFRESH_MS,
  STORY_BUCKETS,
  MAX_RESULTS_PER_QUERY,
  CLUSTER_EPSILON,
  CLUSTER_MIN_PTS,
  MAX_STORIES,
} from '../config';
import { Tweet } from '../types';
import { ingestTweets } from './ingest';
import { preprocessTweets } from './preprocess';
import { embedTweets } from './embed';
import { clusterTweets } from './cluster';
import { scoreAndRank } from './rank';
import { summarizeClusters } from './summarize';
import { MOCK_STORIES } from './mock-data';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

class Pipeline {
  // Full pipeline: ingests fresh tweets from X API, then processes them.
  // Only calls the X API when cached tweets are stale (older than TWEETS_TTL_MS).
  // If tweets are still fresh, delegates to processStoriesFromCache().
  async run(): Promise<void> {
    if (cache.isRefreshing) return;
    cache.isRefreshing = true;

    try {
      const runAt = new Date().toISOString();
      await setCacheMeta({ lastRunAt: runAt });

      if (USE_MOCK) {
        console.log('[Pipeline] Mock mode — loading mock stories');
        await setStories(MOCK_STORIES);
        await setCacheMeta({
          lastSuccessfulRunAt: runAt,
          lastTweetsFetchedAt: runAt,
          error: null,
        });
        console.log(`[Pipeline] Loaded ${MOCK_STORIES.length} mock stories`);
        return;
      }

      const tweetsStale = await areTweetsStale();

      if (!tweetsStale) {
        console.log('[Pipeline] Tweets still fresh — skipping X API call');
        cache.isRefreshing = false;
        return this.processStoriesFromCache();
      }

      console.log('[Pipeline] Tweets are stale — ingesting from X API...');

      let tweets: Tweet[];
      try {
        tweets = await ingestTweets(STORY_BUCKETS, MAX_RESULTS_PER_QUERY);
        console.log(`[Pipeline] Ingested ${tweets.length} tweets`);
        await setRawTweets(tweets);
        await setCacheMeta({ lastTweetsFetchedAt: new Date().toISOString() });
      } catch (ingestErr) {
        const fallback = await getRawTweets();
        if (!fallback) throw ingestErr;
        console.warn('[Pipeline] X API failed, falling back to cached tweets:', ingestErr);
        tweets = fallback;
      }

      await this.processTweets(tweets);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await setCacheMeta({ error: errorMsg });
      console.error('[Pipeline] Run failed:', errorMsg);
    } finally {
      cache.isRefreshing = false;
    }
  }

  // DEV ONLY — forces X API ingestion regardless of tweet freshness.
  async forceIngest(): Promise<void> {
    if (cache.isRefreshing) return;
    cache.isRefreshing = true;

    try {
      const runAt = new Date().toISOString();
      await setCacheMeta({ lastRunAt: runAt });
      console.log('[Pipeline] Force-ingesting tweets from X API...');

      const tweets = await ingestTweets(STORY_BUCKETS, MAX_RESULTS_PER_QUERY);
      console.log(`[Pipeline] Ingested ${tweets.length} tweets`);
      await setRawTweets(tweets);
      await setCacheMeta({ lastTweetsFetchedAt: new Date().toISOString() });
      await this.processTweets(tweets);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await setCacheMeta({ error: errorMsg });
      console.error('[Pipeline] forceIngest failed:', errorMsg);
    } finally {
      cache.isRefreshing = false;
    }
  }

  // Re-processes stories from already-cached tweets — never calls X API.
  // Used by the manual refresh button and as a fallback when tweets are fresh.
  async processStoriesFromCache(): Promise<void> {
    if (cache.isRefreshing) return;

    const tweets = await getRawTweets();
    if (!tweets) {
      console.warn('[Pipeline] No cached tweets found, falling back to full run');
      return this.run();
    }

    cache.isRefreshing = true;
    try {
      const runAt = new Date().toISOString();
      await setCacheMeta({ lastRunAt: runAt });
      console.log(`[Pipeline] Re-processing ${tweets.length} cached tweets (no X API call)`);

      await this.processTweets(tweets);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await setCacheMeta({ error: errorMsg });
      console.error('[Pipeline] processStoriesFromCache failed:', errorMsg);
    } finally {
      cache.isRefreshing = false;
    }
  }

  private async processTweets(tweets: Tweet[]): Promise<void> {
    const cleaned = preprocessTweets(tweets);
    console.log(`[Pipeline] Preprocessed: ${cleaned.length} unique tweets`);

    const embedded = await embedTweets(cleaned);
    console.log(`[Pipeline] Embedded ${embedded.length} tweets`);

    const clusters = clusterTweets(embedded, CLUSTER_EPSILON, CLUSTER_MIN_PTS);
    console.log(`[Pipeline] Clustered into ${clusters.length} groups`);

    const ranked = scoreAndRank(clusters, MAX_STORIES);
    console.log(`[Pipeline] Ranked, top ${ranked.length} clusters selected`);

    const stories = await summarizeClusters(ranked);
    console.log(`[Pipeline] Generated ${stories.length} stories`);

    await setStories(stories);
    await setCacheMeta({ lastSuccessfulRunAt: new Date().toISOString(), error: null });
    console.log('[Pipeline] Run complete.');
  }

  // Decides the right action on startup / periodic timer:
  // 1. Tweets stale → full run (ingest + process)
  // 2. Tweets fresh but no stories → process from cache
  // 3. Tweets fresh and stories exist → skip
  async smartRun(): Promise<void> {
    if (cache.isRefreshing) return;

    const tweetsStale = await areTweetsStale();
    if (tweetsStale) {
      return this.run();
    }

    const storiesExist = await hasStories();
    if (!storiesExist) {
      console.log('[Pipeline] Tweets are fresh but no stories — generating from cache');
      return this.processStoriesFromCache();
    }

    console.log('[Pipeline] Tweets fresh & stories exist — nothing to do');
  }
}

// DEV ONLY: setInterval keeps the pipeline running in a single Node.js process.
// In production, replace with a cron job, platform scheduler (Vercel Cron, Railway,
// AWS EventBridge), or a dedicated worker process. setInterval is not reliable
// under serverless cold starts, auto-scaling, or multi-instance deployments.

const g = globalThis as { __pipeline?: Pipeline; __pipelineTimer?: ReturnType<typeof setInterval> };

export function getOrInitPipeline(): Pipeline {
  const isStale = g.__pipeline && typeof g.__pipeline.forceIngest !== 'function';
  if (isStale) {
    clearInterval(g.__pipelineTimer);
    g.__pipeline = undefined;
  }

  if (!g.__pipeline) {
    g.__pipeline = new Pipeline();

    g.__pipeline.smartRun();

    g.__pipelineTimer = setInterval(() => {
      g.__pipeline?.smartRun();
    }, PIPELINE_REFRESH_MS);
  }

  return g.__pipeline;
}

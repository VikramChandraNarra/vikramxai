import { cache, setStories, setCacheMeta, getRawTweets, setRawTweets, isCacheValid } from '../cache';
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
  async run(): Promise<void> {
    if (cache.isRefreshing) return;

    if (await isCacheValid()) {
      console.log('[Pipeline] Cache still valid, skipping run');
      return;
    }

    cache.isRefreshing = true;

    try {
      const runAt = new Date().toISOString();
      await setCacheMeta({ lastRunAt: runAt });

      if (USE_MOCK) {
        console.log('[Pipeline] Mock mode — loading mock stories');
        await setStories(MOCK_STORIES);
        await setCacheMeta({ lastSuccessfulRunAt: runAt, error: null });
        console.log(`[Pipeline] Loaded ${MOCK_STORIES.length} mock stories`);
        return;
      }

      console.log('[Pipeline] Starting run...');

      // ── Ingest with fallback to cached tweets ──────────────────────────────
      let tweets: Tweet[];
      try {
        tweets = await ingestTweets(STORY_BUCKETS, MAX_RESULTS_PER_QUERY);
        console.log(`[Pipeline] Ingested ${tweets.length} tweets`);
        // Cache raw tweets so subsequent runs can fall back if X API fails.
        await setRawTweets(tweets);
      } catch (ingestErr) {
        const fallback = await getRawTweets();
        if (!fallback) throw ingestErr; // no fallback — let the run fail
        console.warn('[Pipeline] X API failed, falling back to cached tweets:', ingestErr);
        tweets = fallback;
      }

      // ── Standard pipeline ──────────────────────────────────────────────────
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
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await setCacheMeta({ error: errorMsg });
      console.error('[Pipeline] Run failed:', errorMsg);
    } finally {
      cache.isRefreshing = false;
    }
  }

  // Regenerates stories using the tweets already in Redis — no X API call.
  // Used by the manual refresh endpoint to save API credits.
  async runWithCachedTweets(): Promise<void> {
    if (cache.isRefreshing) return;

    const tweets = await getRawTweets();
    if (!tweets) {
      console.warn('[Pipeline] runWithCachedTweets: no cached tweets found, falling back to full run');
      return this.run();
    }

    cache.isRefreshing = true;
    try {
      const runAt = new Date().toISOString();
      await setCacheMeta({ lastRunAt: runAt });
      console.log(`[Pipeline] Re-processing ${tweets.length} cached tweets (no X API call)`);

      const cleaned = preprocessTweets(tweets);
      const embedded = await embedTweets(cleaned);
      const clusters = clusterTweets(embedded, CLUSTER_EPSILON, CLUSTER_MIN_PTS);
      const ranked = scoreAndRank(clusters, MAX_STORIES);
      const stories = await summarizeClusters(ranked);

      await setStories(stories);
      await setCacheMeta({ lastSuccessfulRunAt: new Date().toISOString(), error: null });
      console.log(`[Pipeline] Re-generated ${stories.length} stories from cache`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await setCacheMeta({ error: errorMsg });
      console.error('[Pipeline] runWithCachedTweets failed:', errorMsg);
    } finally {
      cache.isRefreshing = false;
    }
  }
}

// DEV ONLY: setInterval keeps the pipeline running in a single Node.js process.
// In production, replace with a cron job, platform scheduler (Vercel Cron, Railway,
// AWS EventBridge), or a dedicated worker process. setInterval is not reliable
// under serverless cold starts, auto-scaling, or multi-instance deployments.

const g = globalThis as { __pipeline?: Pipeline; __pipelineTimer?: ReturnType<typeof setInterval> };

export function getOrInitPipeline(): Pipeline {
  // Replace a stale singleton (e.g. from a hot-reload cycle before a new method
  // was added). Checking for the newest method is sufficient — if it's missing
  // the instance predates the current class definition.
  const isStale = g.__pipeline && typeof g.__pipeline.runWithCachedTweets !== 'function';
  if (isStale) {
    clearInterval(g.__pipelineTimer);
    g.__pipeline = undefined;
  }

  if (!g.__pipeline) {
    g.__pipeline = new Pipeline();

    // Kick off the first run immediately
    g.__pipeline.run();

    // Schedule subsequent refreshes
    g.__pipelineTimer = setInterval(() => {
      g.__pipeline?.run();
    }, PIPELINE_REFRESH_MS);
  }

  return g.__pipeline;
}

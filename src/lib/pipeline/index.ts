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
}

// DEV ONLY: setInterval keeps the pipeline running in a single Node.js process.
// In production, replace with a cron job, platform scheduler (Vercel Cron, Railway,
// AWS EventBridge), or a dedicated worker process. setInterval is not reliable
// under serverless cold starts, auto-scaling, or multi-instance deployments.

const g = globalThis as { __pipeline?: Pipeline; __pipelineTimer?: ReturnType<typeof setInterval> };

export function getOrInitPipeline(): Pipeline {
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

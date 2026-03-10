import { cache, setStories } from '../cache';
import {
  PIPELINE_REFRESH_MS,
  SEARCH_QUERIES,
  MAX_RESULTS_PER_QUERY,
  CLUSTER_EPSILON,
  CLUSTER_MIN_PTS,
  MAX_STORIES,
} from '../config';
import { ingestTweets } from './ingest';
import { preprocessTweets } from './preprocess';
import { embedTweets } from './embed';
import { clusterTweets } from './cluster';
import { scoreAndRank } from './rank';
import { summarizeClusters } from './summarize';

class Pipeline {
  async run(): Promise<void> {
    if (cache.isRefreshing) return;
    cache.isRefreshing = true;
    cache.lastRunAt = new Date();

    try {
      console.log('[Pipeline] Starting run...');
      const tweets = await ingestTweets(SEARCH_QUERIES, MAX_RESULTS_PER_QUERY);
      console.log(`[Pipeline] Ingested ${tweets.length} tweets`);

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

      setStories(stories);
      cache.lastSuccessfulRunAt = new Date();
      cache.error = null;
      console.log('[Pipeline] Run complete.');
    } catch (err) {
      cache.error = err instanceof Error ? err.message : String(err);
      console.error('[Pipeline] Run failed:', cache.error);
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

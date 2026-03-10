import { getOrInitPipeline } from '@/lib/pipeline';
import { getStories, cache, getCacheAgeMs, isCacheValid } from '@/lib/cache';

export async function GET() {
  const pipeline = getOrInitPipeline();

  if (!isCacheValid() && !cache.isRefreshing) {
    // Cache is stale — kick off a background refresh but don't wait for it.
    // The caller receives the existing (possibly empty) cache immediately.
    pipeline.run();
  }

  const stories = getStories();
  const [headlineStory = null, ...supportingStories] = stories;

  return Response.json({
    headlineStory,
    stories: supportingStories,
    status: {
      isRunning: cache.isRefreshing,
      lastRunAt: cache.lastRunAt?.toISOString() ?? null,
      lastSuccessfulRunAt: cache.lastSuccessfulRunAt?.toISOString() ?? null,
      error: cache.error,
      storyCount: stories.length,
      cacheAgeMs: getCacheAgeMs(),
    },
  });
}

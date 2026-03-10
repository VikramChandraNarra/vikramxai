import { getOrInitPipeline } from '@/lib/pipeline';
import { cache, getStories, getCacheMeta, getCacheAgeMs, isCacheValid } from '@/lib/cache';

export async function GET() {
  const pipeline = getOrInitPipeline();

  const valid = await isCacheValid();
  if (!valid && !cache.isRefreshing) {
    // Cache is stale — kick off a background refresh but don't wait for it.
    // The caller receives the existing (possibly empty) cache immediately.
    pipeline.run();
  }

  const [stories, meta, cacheAgeMs] = await Promise.all([
    getStories(),
    getCacheMeta(),
    getCacheAgeMs(),
  ]);

  const [headlineStory = null, ...supportingStories] = stories;

  return Response.json({
    headlineStory,
    stories: supportingStories,
    status: {
      isRunning: cache.isRefreshing,
      lastRunAt: meta.lastRunAt,
      lastSuccessfulRunAt: meta.lastSuccessfulRunAt,
      error: meta.error,
      storyCount: stories.length,
      cacheAgeMs,
    },
  });
}

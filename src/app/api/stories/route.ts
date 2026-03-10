import { getOrInitPipeline } from '@/lib/pipeline';
import { getStories, cache, getCacheAgeMs } from '@/lib/cache';

export async function GET() {
  getOrInitPipeline();

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

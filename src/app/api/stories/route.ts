import { getOrInitPipeline } from '@/lib/pipeline';
import { MOCK_STORIES } from '@/lib/pipeline/mock-data';
import { cache, getStories, getCacheMeta, getCacheAgeMs, areTweetsStale, hasStories } from '@/lib/cache';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

export async function GET() {
  if (USE_MOCK) {
    const [headlineStory = null, ...supportingStories] = MOCK_STORIES;
    return Response.json({
      headlineStory,
      stories: supportingStories,
      status: {
        isRunning: false,
        lastRunAt: new Date().toISOString(),
        lastSuccessfulRunAt: new Date().toISOString(),
        lastTweetsFetchedAt: null,
        error: null,
        storyCount: MOCK_STORIES.length,
        cacheAgeMs: 0,
      },
    });
  }

  const pipeline = getOrInitPipeline();

  if (!cache.isRefreshing) {
    const tweetsStale = await areTweetsStale();
    const storiesExist = await hasStories();

    if (tweetsStale) {
      pipeline.run();
    } else if (!storiesExist) {
      pipeline.processStoriesFromCache();
    }
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
      lastTweetsFetchedAt: meta.lastTweetsFetchedAt,
      error: meta.error,
      storyCount: stories.length,
      cacheAgeMs,
    },
  });
}

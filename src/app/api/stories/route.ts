import { getOrInitPipeline } from '@/lib/pipeline';
import { MOCK_STORIES } from '@/lib/pipeline/mock-data';
import { cache, getStories, getCacheMeta, getCacheAgeMs, areTweetsStale, hasStories } from '@/lib/cache';
import { Story } from '@/lib/types';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

function selectHeadline(stories: Story[], shuffle: boolean): { headlineStory: Story | null; rest: Story[] } {
  if (stories.length === 0) return { headlineStory: null, rest: [] };

  // Take top 5 by score (stories are already sorted by score)
  const top5 = stories.slice(0, 5);

  let heroIdx = 0;

  if (shuffle) {
    // Weighted random pick among top 5 — only on explicit user refresh.
    const weights = top5.map((s) => {
      const base = s.score;
      const sizeBonus = 0.1 * (s.clusterSize / Math.max(1, ...top5.map((t) => t.clusterSize)));
      const jitter = Math.random() * 0.08;
      return base + sizeBonus + jitter;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll <= 0) { heroIdx = i; break; }
    }
  } else {
    // Deterministic: pick highest clusterSize among top 5 (tie-break by score)
    for (let i = 1; i < top5.length; i++) {
      const current = top5[heroIdx];
      const candidate = top5[i];
      if (
        candidate.clusterSize > current.clusterSize ||
        (candidate.clusterSize === current.clusterSize && candidate.score > current.score)
      ) {
        heroIdx = i;
      }
    }
  }

  const headline = { ...top5[heroIdx], isHeadline: true };
  const rest = stories
    .filter((_, i) => i !== heroIdx)
    .map((s) => ({ ...s, isHeadline: false }));

  return { headlineStory: headline, rest };
}

export async function GET(request: Request) {
  const shuffle = new URL(request.url).searchParams.has('shuffle');

  if (USE_MOCK) {
    const { headlineStory, rest } = selectHeadline(MOCK_STORIES, shuffle);
    return Response.json({
      headlineStory,
      stories: rest,
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
      // Tweets exist but stories cache is empty — await processing so we
      // can return stories in this response instead of an empty feed.
      await pipeline.processStoriesFromCache();
    }
  }

  const [stories, meta, cacheAgeMs] = await Promise.all([
    getStories(),
    getCacheMeta(),
    getCacheAgeMs(),
  ]);

  const { headlineStory, rest: supportingStories } = selectHeadline(stories, shuffle);

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

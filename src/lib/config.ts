// How often the background pipeline auto-refreshes stories (dev: setInterval).
// In production replace with a cron job or platform scheduler.
export const PIPELINE_REFRESH_MS = 24 * 60 * 60 * 1000; // 24 hours

// How long raw tweets from X API are considered fresh before re-ingesting.
export const TWEETS_TTL_MS = 24 * 60 * 60 * 1000; // 1 hour

// Stories Redis key TTL — generous so stories never vanish mid-session.
// Actual freshness is driven by TWEETS_TTL_MS + pipeline metadata.
export const STORIES_REDIS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
// Maximum tweets fetched per search query bucket during a pipeline run.
// X API v2 hard cap is 100 per request.
export const MAX_RESULTS_PER_QUERY = 100;

// Maximum stories surfaced after ranking and clustering.
export const MAX_STORIES = 20;
// Story buckets — maps a category label to the X search queries used to fill it.
// Replaces the old flat SEARCH_QUERIES array. Add, remove, or edit buckets here
// without touching any pipeline code.
// export const STORY_BUCKETS: Record<string, string[]> = {
//   breaking: [
//     'breaking news lang:en -is:retweet',
//     'developing story lang:en -is:retweet',
//   ],
//   ai: [
//     'AI OR "artificial intelligence" lang:en -is:retweet',
//     'LLM OR GPT OR Grok OR Claude lang:en -is:retweet',
//   ],
//   technology: [
//     'tech news lang:en -is:retweet',
//     'startup OR "product launch" lang:en -is:retweet',
//   ],
//   politics: [
//     'politics lang:en -is:retweet',
//     'election OR government lang:en -is:retweet',
//   ],
//   business: [
//     'stocks OR markets OR earnings lang:en -is:retweet',
//   ],
//   culture: [
//     'viral OR trending lang:en -is:retweet',
//     'music OR film OR celebrity lang:en -is:retweet',
//   ],
// };

export const STORY_BUCKETS: Record<string, string[]> = {
  breaking: [
    '("breaking news" OR "developing story") lang:en -is:retweet -is:reply',
    '("just announced" OR "major update") lang:en -is:retweet -is:reply has:links'
  ],

  ai: [
    '(AI OR "artificial intelligence" OR LLM OR GPT OR Grok OR Claude) lang:en -is:retweet -is:reply',
    '("AI model" OR "AI startup" OR "AI research" OR "AI release") lang:en -is:retweet -is:reply has:links'
  ],

  technology: [
    '("product launch" OR "new device" OR "tech announcement") lang:en -is:retweet -is:reply has:links',
    '(startup OR "funding round" OR "Series A" OR "tech startup") lang:en -is:retweet -is:reply'
  ],

  politics: [
    '("White House" OR Congress OR Senate OR "Supreme Court") lang:en -is:retweet -is:reply has:links',
    '(election OR campaign OR "policy proposal" OR legislation) lang:en -is:retweet -is:reply'
  ],

  business: [
    '(earnings OR "quarterly results" OR "revenue growth") lang:en -is:retweet -is:reply has:links',
    '(stocks OR markets OR IPO OR "stock market") lang:en -is:retweet -is:reply'
  ],

  culture: [
    '(film OR movie OR "box office" OR "tv series") lang:en -is:retweet -is:reply',
    '(music OR album OR tour OR concert) lang:en -is:retweet -is:reply'
  ],

  nearby: [
    '"San Francisco" (news OR event OR traffic OR weather OR transit OR police OR protest OR concert) lang:en -is:retweet -is:reply'
  ],
};
// Clustering
export const CLUSTER_EPSILON = 0.25;
export const CLUSTER_MIN_PTS = 2;
// Merge clusters that share any single URL or 2+ identical hashtags (deduplication).
export const MERGE_MIN_SHARED_URLS = 1;
export const MERGE_MIN_SHARED_TAGS = 2;
// Noise: only keep as singleton if engagement meets this bar
export const NOISE_MIN_ENGAGEMENT = 500;

// Cluster credibility — a cluster must pass at least one of these to survive.
// If it fails all three it is discarded before ranking.
export const MIN_CLUSTER_SIZE = 3;
export const MIN_TOTAL_ENGAGEMENT = 50;
export const MIN_UNIQUE_AUTHORS = 2;

// Tweet quality — used when selecting representative tweets for summarization.
export const MIN_TEXT_LENGTH = 30;
export const MAX_URLS_PER_TWEET = 1;

// Ranking
export const RECENCY_HALF_LIFE_HOURS = 6;

// Summarization
export const SUMMARIZE_MODEL = 'gpt-4o-mini';
export const REP_TWEET_COUNT = 5;
export const EMBED_MODEL = 'text-embedding-3-small';

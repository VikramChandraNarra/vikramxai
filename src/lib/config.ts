// How often the background pipeline auto-refreshes stories (dev: setInterval).
// In production replace with a cron job or platform scheduler.
export const PIPELINE_REFRESH_MS = 24 * 60 * 60 * 1000; // 24 hours

// How long cached stories are considered fresh. Requests within this window
// are served instantly from cache; stale requests get the old cache immediately
// while a background refresh fires (stale-while-revalidate).
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Maximum tweets fetched per search query bucket during a pipeline run.
// X API v2 hard cap is 100 per request.
export const MAX_RESULTS_PER_QUERY = 40;

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
  breaking: ['breaking news OR "developing story" lang:en -is:retweet'],
  ai: ['AI OR LLM OR GPT OR Grok OR Claude lang:en -is:retweet'],
  technology: ['tech news OR startup OR "product launch" lang:en -is:retweet'],
  politics: ['politics OR election OR government lang:en -is:retweet'],
  business: ['stocks OR markets OR earnings lang:en -is:retweet'],
  culture: ['viral OR trending OR music OR film lang:en -is:retweet'],
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

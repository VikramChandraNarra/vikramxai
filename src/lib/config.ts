// How often the background pipeline auto-refreshes stories (dev: setInterval).
// In production replace with a cron job or platform scheduler.
export const PIPELINE_REFRESH_MS = 100 * 60 * 1000; // 100 minutes

// How long cached stories are considered fresh. Requests within this window
// are served instantly from cache; stale requests get the old cache immediately
// while a background refresh fires (stale-while-revalidate).
export const CACHE_TTL_MS = 4 * 60 * 1000; // 4 minutes

// Maximum tweets fetched per search query bucket during a pipeline run.
// X API v2 hard cap is 100 per request.
export const MAX_RESULTS_PER_QUERY = 100;

// Maximum stories surfaced after ranking and clustering.
export const MAX_STORIES = 20;
export const SEARCH_QUERIES = [
  'AI technology lang:en -is:retweet',
  'breaking news lang:en -is:retweet',
  'trending politics lang:en -is:retweet',
];

// Clustering
export const CLUSTER_EPSILON = 0.25;
export const CLUSTER_MIN_PTS = 2;
// Conservative merge: clusters must share 2+ identical URLs OR 3+ identical hashtags
export const MERGE_MIN_SHARED_URLS = 2;
export const MERGE_MIN_SHARED_TAGS = 3;
// Noise: only keep as singleton if engagement meets this bar
export const NOISE_MIN_ENGAGEMENT = 500;

// Ranking
export const RECENCY_HALF_LIFE_HOURS = 6;

// Summarization
export const SUMMARIZE_MODEL = 'gpt-4o';
export const REP_TWEET_COUNT = 5;
export const EMBED_MODEL = 'text-embedding-3-small';

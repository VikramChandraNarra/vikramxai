export const PIPELINE_REFRESH_MS = 5 * 60 * 1000;
export const MAX_RESULTS_PER_QUERY = 100;
export const MAX_STORIES = 10;
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

import { Tweet } from '../types';

interface XTweetData {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    impression_count: number;
  };
}

interface XUserData {
  id: string;
  username: string;
}

interface XSearchResponse {
  data?: XTweetData[];
  includes?: {
    users?: XUserData[];
  };
  meta?: {
    result_count: number;
    next_token?: string;
  };
}

async function searchTweets(query: string, maxResults: number): Promise<Tweet[]> {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) {
    throw new Error('X_BEARER_TOKEN environment variable not set');
  }

  const params = new URLSearchParams({
    query,
    max_results: String(Math.min(maxResults, 100)),
    'tweet.fields': 'author_id,created_at,public_metrics',
    'user.fields': 'username',
    expansions: 'author_id',
  });

  const url = `https://api.twitter.com/2/tweets/search/recent?${params}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`X API error ${response.status}: ${body}`);
  }

  const data: XSearchResponse = await response.json();

  if (!data.data || data.data.length === 0) {
    return [];
  }

  const userMap = new Map<string, string>();
  for (const user of data.includes?.users ?? []) {
    userMap.set(user.id, user.username);
  }

  return data.data.map((t) => ({
    id: t.id,
    text: t.text,
    authorId: t.author_id,
    authorUsername: userMap.get(t.author_id) ?? t.author_id,
    createdAt: new Date(t.created_at),
    likeCount: t.public_metrics?.like_count ?? 0,
    retweetCount: t.public_metrics?.retweet_count ?? 0,
    replyCount: t.public_metrics?.reply_count ?? 0,
    impressionCount: t.public_metrics?.impression_count ?? 0,
  }));
}

export async function ingestTweets(queries: string[], maxResultsPerQuery: number): Promise<Tweet[]> {
  const results = await Promise.allSettled(
    queries.map((q) => searchTweets(q, maxResultsPerQuery))
  );

  const tweets: Tweet[] = [];
  const seenIds = new Set<string>();

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const tweet of result.value) {
        if (!seenIds.has(tweet.id)) {
          seenIds.add(tweet.id);
          tweets.push(tweet);
        }
      }
    } else {
      console.error('[ingest] query failed:', result.reason);
    }
  }

  return tweets;
}

import { Tweet, TweetMedia } from '../types';

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
  attachments?: {
    media_keys?: string[];
  };
}

interface XUserData {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
}

interface XMediaData {
  media_key: string;
  type: 'photo' | 'video' | 'animated_gif';
  url?: string;          // present for photos
  preview_image_url?: string; // present for videos/gifs
}

interface XSearchResponse {
  data?: XTweetData[];
  includes?: {
    users?: XUserData[];
    media?: XMediaData[];
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
    'tweet.fields': 'author_id,created_at,public_metrics,attachments',
    'user.fields': 'username,name,profile_image_url',
    'media.fields': 'url,preview_image_url,type',
    expansions: 'author_id,attachments.media_keys',
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

  // Build lookup maps from the includes
  const userMap = new Map<string, XUserData>();
  for (const user of data.includes?.users ?? []) {
    userMap.set(user.id, user);
  }

  const mediaMap = new Map<string, TweetMedia>();
  for (const m of data.includes?.media ?? []) {
    const imageUrl = m.type === 'photo' ? m.url : m.preview_image_url;
    if (imageUrl) {
      mediaMap.set(m.media_key, { url: imageUrl, type: m.type });
    }
  }

  return data.data.map((t) => {
    const user = userMap.get(t.author_id);
    const media = (t.attachments?.media_keys ?? [])
      .map((key) => mediaMap.get(key))
      .filter((m): m is TweetMedia => m !== undefined);

    return {
      id: t.id,
      text: t.text,
      authorId: t.author_id,
      authorUsername: user?.username ?? t.author_id,
      authorDisplayName: user?.name,
      authorProfileImageUrl: user?.profile_image_url,
      createdAt: new Date(t.created_at),
      likeCount: t.public_metrics?.like_count ?? 0,
      retweetCount: t.public_metrics?.retweet_count ?? 0,
      replyCount: t.public_metrics?.reply_count ?? 0,
      impressionCount: t.public_metrics?.impression_count ?? 0,
      media: media.length > 0 ? media : undefined,
    };
  });
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

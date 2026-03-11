export interface TweetMedia {
  url: string;
  type: 'photo' | 'video' | 'animated_gif';
}

export interface Tweet {
  id: string;
  text: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName?: string;
  authorProfileImageUrl?: string;
  createdAt: Date;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  impressionCount: number;
  media?: TweetMedia[];
  embedding?: number[];
  normalizedText?: string;
  entities?: { hashtags: string[]; urls: string[] };
  category?: string;
}

export interface TweetPreview {
  id: string;
  text: string;
  authorUsername: string;
  authorDisplayName?: string;
  authorProfileImageUrl?: string;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
  replyCount?: number;
  impressionCount?: number;
  media?: TweetMedia[];
}

export interface ScoredCluster {
  tweets: Tweet[];
  score: number;
  totalEngagement: number;
  velocity: number;
  uniqueAuthors: number;
  category: string;
}

export interface Story {
  id: string;
  headline: string;
  summary: string;
  representativeTweets: TweetPreview[];
  isHeadline: boolean;
  score: number;
  totalEngagement: number;
  velocity: number;
  uniqueAuthors: number;
  clusterSize: number;
  totalImpressions: number;
  generatedAt: string;
  category: string;
}

export interface PipelineStatus {
  isRunning: boolean;
  lastRunAt: string | null;
  lastSuccessfulRunAt: string | null;
  error: string | null;
  storyCount: number;
}

export interface Tweet {
  id: string;
  text: string;
  authorId: string;
  authorUsername: string;
  createdAt: Date;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  impressionCount: number;
  embedding?: number[];
  normalizedText?: string;
  entities?: { hashtags: string[]; urls: string[] };
}

export interface TweetPreview {
  id: string;
  text: string;
  authorUsername: string;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
}

export interface ScoredCluster {
  tweets: Tweet[];
  score: number;
  totalEngagement: number;
  velocity: number;
  uniqueAuthors: number;
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
  generatedAt: string;
}

export interface PipelineStatus {
  isRunning: boolean;
  lastRunAt: string | null;
  lastSuccessfulRunAt: string | null;
  error: string | null;
  storyCount: number;
}

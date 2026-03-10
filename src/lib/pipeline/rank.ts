import { Tweet, ScoredCluster } from '../types';
import { RECENCY_HALF_LIFE_HOURS } from '../config';

export function tweetEngagement(t: Tweet): number {
  return t.likeCount + 3 * t.retweetCount + 2 * t.replyCount + 0.01 * t.impressionCount;
}

function medianAgeHours(tweets: Tweet[]): number {
  const now = Date.now();
  const ages = tweets
    .map((t) => (now - t.createdAt.getTime()) / (1000 * 60 * 60))
    .sort((a, b) => a - b);
  const mid = Math.floor(ages.length / 2);
  return ages.length % 2 === 0 ? (ages[mid - 1] + ages[mid]) / 2 : ages[mid];
}

function recencyScore(tweets: Tweet[]): number {
  const ageHours = medianAgeHours(tweets);
  return Math.exp((-Math.LN2 * ageHours) / RECENCY_HALF_LIFE_HOURS);
}

function minMaxNorm(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

export function scoreAndRank(clusters: Tweet[][], maxStories: number): ScoredCluster[] {
  if (clusters.length === 0) return [];

  const ONE_HOUR_MS = 60 * 60 * 1000;
  const now = Date.now();

  const raw = clusters.map((tweets) => {
    const totalEngagement = tweets.reduce((sum, t) => sum + tweetEngagement(t), 0);
    const velocity = tweets
      .filter((t) => now - t.createdAt.getTime() <= ONE_HOUR_MS)
      .reduce((sum, t) => sum + tweetEngagement(t), 0);
    const uniqueAuthors = new Set(tweets.map((t) => t.authorId)).size;
    return { tweets, totalEngagement, velocity, uniqueAuthors };
  });

  const normEngagement = minMaxNorm(raw.map((c) => c.totalEngagement));
  const normVelocity = minMaxNorm(raw.map((c) => c.velocity));
  const normAuthors = minMaxNorm(raw.map((c) => c.uniqueAuthors));

  const scored: ScoredCluster[] = raw.map((c, i) => ({
    ...c,
    score:
      0.35 * normEngagement[i] +
      0.30 * normVelocity[i] +
      0.20 * recencyScore(c.tweets) +
      0.15 * normAuthors[i],
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, maxStories);
}

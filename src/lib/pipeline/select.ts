import { Tweet, ScoredCluster } from '../types';
import { REP_TWEET_COUNT } from '../config';
import { tweetEngagement } from './rank';

export function selectRepresentativeTweets(cluster: ScoredCluster): Tweet[] {
  const sorted = [...cluster.tweets].sort(
    (a, b) => tweetEngagement(b) - tweetEngagement(a)
  );

  const selected: Tweet[] = [];
  const authorPickCount = new Map<string, number>();

  for (const tweet of sorted) {
    if (selected.length >= REP_TWEET_COUNT) break;
    if (tweet.text.length < 20) continue;

    const picks = authorPickCount.get(tweet.authorId) ?? 0;
    if (picks >= 2) continue;

    selected.push(tweet);
    authorPickCount.set(tweet.authorId, picks + 1);
  }

  return selected;
}

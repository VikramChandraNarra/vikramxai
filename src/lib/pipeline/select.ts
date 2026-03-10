import { Tweet, ScoredCluster } from '../types';
import { REP_TWEET_COUNT, MIN_TEXT_LENGTH, MAX_URLS_PER_TWEET } from '../config';
import { tweetEngagement } from './rank';

// Matches common emoji ranges (covers most Emoji_Presentation characters).
const EMOJI_RE =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}\u{1FA00}-\u{1FAFF}]/gu;

function isMostlyEmojis(text: string): boolean {
  const stripped = text.replace(/\s/g, '');
  if (stripped.length === 0) return true;
  const emojiCount = (stripped.match(EMOJI_RE) ?? []).length;
  return emojiCount / stripped.length > 0.5;
}

function urlCount(text: string): number {
  return (text.match(/https?:\/\/\S+/g) ?? []).length;
}

export function selectRepresentativeTweets(cluster: ScoredCluster): Tweet[] {
  const sorted = [...cluster.tweets].sort(
    (a, b) => tweetEngagement(b) - tweetEngagement(a)
  );

  const selected: Tweet[] = [];
  const authorPickCount = new Map<string, number>();

  for (const tweet of sorted) {
    if (selected.length >= REP_TWEET_COUNT) break;
    if (tweet.text.length < MIN_TEXT_LENGTH) continue;
    if (urlCount(tweet.text) > MAX_URLS_PER_TWEET) continue;
    if (isMostlyEmojis(tweet.text)) continue;

    const picks = authorPickCount.get(tweet.authorId) ?? 0;
    if (picks >= 2) continue;

    selected.push(tweet);
    authorPickCount.set(tweet.authorId, picks + 1);
  }

  return selected;
}

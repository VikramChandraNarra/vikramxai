import { Tweet } from '../types';

function normalize(text: string): string {
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // strip zero-width chars
    .replace(/\s+/g, ' ')                   // collapse whitespace
    .trim()
    .toLowerCase();
}

function extractEntities(text: string): { hashtags: string[]; urls: string[] } {
  const hashtagMatches = text.match(/(#\w+)/gi) ?? [];
  const hashtags = hashtagMatches.map((h) => h.slice(1).toLowerCase());

  const urlMatches = text.match(/https?:\/\/t\.co\/\w+/gi) ?? [];
  const urls = urlMatches.map((u) => u.toLowerCase());

  return { hashtags, urls };
}

export function preprocessTweets(tweets: Tweet[]): Tweet[] {
  const seen = new Set<string>();
  const result: Tweet[] = [];

  for (const tweet of tweets) {
    const normalizedText = normalize(tweet.text);
    if (seen.has(normalizedText)) continue;
    seen.add(normalizedText);

    result.push({
      ...tweet,
      normalizedText,
      entities: extractEntities(tweet.text),
    });
  }

  return result;
}

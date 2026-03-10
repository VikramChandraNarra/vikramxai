import { ScoredCluster, Story, TweetPreview } from '../types';
import { SUMMARIZE_MODEL } from '../config';
import { selectRepresentativeTweets } from './select';

interface OpenAIChatResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY environment variable not set');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: SUMMARIZE_MODEL,
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI chat error ${response.status}: ${body}`);
  }

  const data: OpenAIChatResponse = await response.json();
  return data.choices[0]?.message.content ?? '{}';
}

async function summarizeCluster(cluster: ScoredCluster, isHeadline: boolean): Promise<Story> {
  const reps = selectRepresentativeTweets(cluster);
  const tweetLines = reps.map((t) => `@${t.authorUsername}: ${t.text}`).join('\n');

  const text = await callOpenAI(`You are a careful news editor. Given these tweets about the same developing story, write:
1. A specific, punchy headline (under 12 words, no clickbait)
2. A 2-sentence factual summary covering who, what, and why it matters

Important: If the tweets describe an unverified claim or rumor rather than confirmed facts, phrase the headline carefully using wording like "Users on X claim..." or "Reports suggest..." instead of presenting it as confirmed fact.

Tweets:
${tweetLines}

Respond with valid JSON only: {"headline": "...", "summary": "..."}`);

  let headline = 'Developing Story';
  let summary = '';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      headline = parsed.headline || headline;
      summary = parsed.summary || summary;
    }
  } catch {
    console.error('[summarize] Failed to parse JSON from response:', text);
  }

  const representativeTweets: TweetPreview[] = reps.map((t) => ({
    id: t.id,
    text: t.text,
    authorUsername: t.authorUsername,
    authorDisplayName: t.authorDisplayName,
    authorProfileImageUrl: t.authorProfileImageUrl,
    createdAt: t.createdAt.toISOString(),
    likeCount: t.likeCount,
    retweetCount: t.retweetCount,
    replyCount: t.replyCount,
    media: t.media,
  }));

  return {
    id: `story-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    headline,
    summary,
    representativeTweets,
    isHeadline,
    score: cluster.score,
    totalEngagement: cluster.totalEngagement,
    velocity: cluster.velocity,
    uniqueAuthors: cluster.uniqueAuthors,
    clusterSize: cluster.tweets.length,
    generatedAt: new Date().toISOString(),
    category: cluster.category,
  };
}

const SUMMARIZE_BATCH_SIZE = 3;

export async function summarizeClusters(clusters: ScoredCluster[]): Promise<Story[]> {
  const stories: Story[] = [];

  for (let i = 0; i < clusters.length; i += SUMMARIZE_BATCH_SIZE) {
    const batch = clusters.slice(i, i + SUMMARIZE_BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((cluster, batchIdx) => summarizeCluster(cluster, i + batchIdx === 0))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        stories.push(result.value);
      } else {
        console.error('[summarize] cluster failed:', result.reason);
      }
    }
  }

  return stories;
}

import { Tweet } from '../types';
import { EMBED_MODEL } from '../config';

interface EmbeddingResponse {
  data: Array<{ index: number; embedding: number[] }>;
}

const BATCH_SIZE = 100;
const MAX_CHARS = 8191;

async function fetchEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI embed error ${response.status}: ${body}`);
  }

  const data: EmbeddingResponse = await response.json();
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

export async function embedTweets(tweets: Tweet[]): Promise<Tweet[]> {
  const result: Tweet[] = [...tweets];

  for (let i = 0; i < result.length; i += BATCH_SIZE) {
    const batch = result.slice(i, i + BATCH_SIZE);
    const texts = batch.map((t) => t.text.slice(0, MAX_CHARS));
    const embeddings = await fetchEmbeddings(texts);
    for (let j = 0; j < batch.length; j++) {
      result[i + j] = { ...result[i + j], embedding: embeddings[j] };
    }
  }

  return result;
}

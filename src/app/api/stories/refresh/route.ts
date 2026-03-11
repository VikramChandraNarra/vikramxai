import { getOrInitPipeline } from '@/lib/pipeline';

export async function POST() {
  const pipeline = getOrInitPipeline();
  pipeline.runWithCachedTweets(); // fire and forget — no X API call
  return Response.json({ message: 'Refresh triggered' });
}

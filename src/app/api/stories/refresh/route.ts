import { getOrInitPipeline } from '@/lib/pipeline';

export async function POST() {
  const pipeline = getOrInitPipeline();
  pipeline.run(); // fire and forget
  return Response.json({ message: 'Refresh triggered' });
}

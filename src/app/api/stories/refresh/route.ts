import { getOrInitPipeline } from '@/lib/pipeline';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

export async function POST() {
  if (USE_MOCK) {
    return Response.json({ message: 'Mock mode — refresh is a no-op' });
  }
  const pipeline = getOrInitPipeline();
  pipeline.processStoriesFromCache();
  return Response.json({ message: 'Refresh triggered' });
}

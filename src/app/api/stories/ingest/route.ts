import { getOrInitPipeline } from '@/lib/pipeline';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

// DEV ONLY — forces a full pipeline run including X API tweet ingestion.
export async function POST() {
  if (USE_MOCK) {
    return Response.json({ message: 'Mock mode — ingestion is a no-op' });
  }
  const pipeline = getOrInitPipeline();
  pipeline.forceIngest();
  return Response.json({ message: 'Full ingestion triggered' });
}

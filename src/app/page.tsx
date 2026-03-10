import { StoriesPageClient } from '@/components/StoriesPageClient';

export default function Home() {
  return (
    <div className="relative flex flex-col min-h-screen bg-black overflow-x-hidden">
      <StoriesPageClient />
    </div>
  );
}

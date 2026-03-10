export function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export interface StoryLabel {
  text: string;
  dotClass: string;
  textClass: string;
}

export function getStoryLabel(story: {
  isHeadline?: boolean;
  velocity: number;
  uniqueAuthors: number;
  score: number;
}): StoryLabel {
  if (story.velocity > 5000)
    return { text: 'Breaking', dotClass: 'bg-red-500', textClass: 'text-red-400' };
  if (story.isHeadline)
    return { text: 'Top Story', dotClass: 'bg-[#1d9bf0]', textClass: 'text-[#1d9bf0]' };
  if (story.velocity > 1500)
    return { text: 'Trending', dotClass: 'bg-amber-400', textClass: 'text-amber-400' };
  if (story.uniqueAuthors > 30)
    return { text: 'Widespread', dotClass: 'bg-emerald-400', textClass: 'text-emerald-400' };
  if (story.score > 0.5)
    return { text: 'Rising', dotClass: 'bg-violet-400', textClass: 'text-violet-400' };
  return { text: 'Developing', dotClass: 'bg-[#71767b]', textClass: 'text-[#71767b]' };
}

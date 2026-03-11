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

export interface HeroStat {
  icon: 'lightning' | 'chart' | 'eye' | 'users' | 'messages';
  value: string;
  label: string;
}

export function getHeroStat(story: {
  velocity: number;
  totalEngagement: number;
  totalImpressions?: number;
  uniqueAuthors: number;
  clusterSize: number;
}): HeroStat {
  if (story.velocity >= 50)
    return { icon: 'lightning', value: formatNum(story.velocity), label: '/hr' };
  if (story.totalEngagement >= 100)
    return { icon: 'chart', value: formatNum(story.totalEngagement), label: 'engagement' };
  if ((story.totalImpressions ?? 0) >= 1000)
    return { icon: 'eye', value: formatNum(story.totalImpressions!), label: 'views' };
  if (story.uniqueAuthors >= 5)
    return { icon: 'users', value: String(story.uniqueAuthors), label: 'voices' };
  return { icon: 'messages', value: String(story.clusterSize), label: 'posts' };
}

export interface StoryLabel {
  text: string;
  dotClass: string;
  textClass: string;
}

export function getStoryLabel(story: {
  isHeadline?: boolean;
  velocity: number;
}, index: number, total: number, medianVelocity: number): StoryLabel {
  if (story.isHeadline)
    return { text: 'Top Story', dotClass: 'bg-[#1d9bf0]', textClass: 'text-[#1d9bf0]' };

  const pct = total > 1 ? index / (total - 1) : 0;

  // Top 10% — but only if velocity is also > 3× median
  if (pct <= 0.1 && story.velocity > 3 * medianVelocity && medianVelocity > 0)
    return { text: 'Breaking', dotClass: 'bg-red-500', textClass: 'text-red-400' };

  if (pct <= 0.3)
    return { text: 'Trending', dotClass: 'bg-amber-400', textClass: 'text-amber-400' };

  if (pct <= 0.6)
    return { text: 'Rising', dotClass: 'bg-violet-400', textClass: 'text-violet-400' };

  return { text: 'New', dotClass: 'bg-slate-400', textClass: 'text-slate-400' };
}

export function computeMedianVelocity(stories: { velocity: number }[]): number {
  if (stories.length === 0) return 0;
  const sorted = [...stories].map((s) => s.velocity).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export type StoryCategory = 'ai' | 'technology' | 'politics' | 'business' | 'culture' | 'breaking' | 'general';

export interface CategoryStyle {
  label: string;
  bgClass: string;
  textClass: string;
}

const CATEGORY_STYLES: Record<StoryCategory, CategoryStyle> = {
  ai: { label: 'AI', bgClass: 'bg-violet-500/15', textClass: 'text-violet-400' },
  technology: { label: 'Tech', bgClass: 'bg-cyan-500/15', textClass: 'text-cyan-400' },
  politics: { label: 'Politics', bgClass: 'bg-orange-500/15', textClass: 'text-orange-400' },
  business: { label: 'Business', bgClass: 'bg-emerald-500/15', textClass: 'text-emerald-400' },
  culture: { label: 'Culture', bgClass: 'bg-pink-500/15', textClass: 'text-pink-400' },
  breaking: { label: 'Breaking', bgClass: 'bg-red-500/15', textClass: 'text-red-400' },
  general: { label: 'General', bgClass: 'bg-slate-500/15', textClass: 'text-slate-400' },
};

export function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_STYLES[category as StoryCategory] ?? CATEGORY_STYLES.general;
}

export function getFirstImage(tweets: Array<{ likeCount: number; retweetCount: number; replyCount?: number; media?: Array<{ url: string; type: string }> }>): string | null {
  const sorted = [...tweets].sort((a, b) => {
    const engA = a.likeCount + 3 * a.retweetCount + 2 * (a.replyCount ?? 0);
    const engB = b.likeCount + 3 * b.retweetCount + 2 * (b.replyCount ?? 0);
    return engB - engA;
  });
  for (const tweet of sorted) {
    for (const m of tweet.media ?? []) {
      if (m.url && m.type === 'photo') return m.url;
    }
  }
  return null;
}

export function getBestTweetUrl(story: { headline: string; representativeTweets: Array<{ id: string; authorUsername: string }> }): string {
  const best = story.representativeTweets[0];
  if (best) return `https://x.com/${best.authorUsername}/status/${best.id}`;
  return `https://x.com/search?q=${encodeURIComponent(story.headline)}&src=typed_query&f=live`;
}

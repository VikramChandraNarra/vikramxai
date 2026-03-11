'use client';

import { Story } from '@/lib/types';
import { formatNum, timeAgo, getHeroStat } from '@/lib/utils';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { HeroStatIcon } from '@/components/stories/HeroStatIcon';
import {
  RiFlashlightFill,
  RiBarChartHorizontalFill,
} from 'react-icons/ri';
import { AvatarStack } from '@/components/ui/AvatarStack';

interface PipelineStatus {
  isRunning: boolean;
  lastRunAt: string | null;
  lastSuccessfulRunAt: string | null;
  error: string | null;
  storyCount: number;
  cacheAgeMs: number | null;
}

interface Props {
  status: PipelineStatus | null;
  stories: Story[];
  headlineStory: Story | null;
  onStoryClick?: (story: Story) => void;
}

function Divider() {
  return <div className="border-t border-white/8 my-5" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.625rem] font-bold tracking-[0.18em] uppercase text-[#71767b] mb-3">
      {children}
    </p>
  );
}

export function RightPanel({ status, stories, headlineStory, onStoryClick }: Props) {
  const all = headlineStory ? [headlineStory, ...stories] : stories;
  const mostEngaged = all.length
    ? [...all].sort((a, b) => b.totalEngagement - a.totalEngagement)[0]
    : null;
  const fastest = all.length
    ? [...all].sort((a, b) => b.velocity - a.velocity)[0]
    : null;

  return (
    <div className="px-4 py-5">
      {/* ── What's moving ── */}
      {all.length > 0 && (
        <>
          <SectionLabel>What&apos;s moving</SectionLabel>
          <div className="space-y-3">
            {all.slice(0, 5).map((story, i) => {
              const stat = getHeroStat(story);
              return (
                <button
                  key={story.id}
                  onClick={() => onStoryClick?.(story)}
                  className="group w-full flex items-start gap-3 rounded-lg -mx-2 px-2 py-1.5 hover:bg-white/4 transition-colors text-left"
                >
                  <span className="text-[0.6875rem] font-black text-[#333] mt-0.5 w-4 shrink-0 text-center select-none">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8125rem] font-bold text-white leading-[1.3] group-hover:text-[#e7e9ea] transition-colors">
                      {story.headline}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <HeroStatIcon icon={stat.icon} size={10} />
                      <span className="text-[0.6875rem] text-[#71767b]">
                        {stat.value} {stat.label}
                      </span>
                      <AvatarStack
                        tweets={story.representativeTweets}
                        totalAuthors={story.uniqueAuthors}
                        maxVisible={2}
                        size={15}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <Divider />
        </>
      )}

      {/* ── Signal leaders ── */}
      {(mostEngaged || fastest) && (
        <>
          <SectionLabel>Signal leaders</SectionLabel>
          <div className="space-y-4">
            {mostEngaged && (
              <button
                onClick={() => onStoryClick?.(mostEngaged)}
                className="group w-full text-left rounded-lg hover:bg-white/4 -mx-2 px-2 py-1.5 transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <RiBarChartHorizontalFill className="text-[#1d9bf0]" size={11} />
                  <span className="text-[0.625rem] font-semibold tracking-[0.12em] uppercase text-[#1d9bf0]">
                    Most engaged
                  </span>
                </div>
                <p className="text-[0.8125rem] font-semibold text-white leading-[1.3] mb-1 group-hover:text-[#e7e9ea] transition-colors">
                  {mostEngaged.headline}
                </p>
                <span className="text-[0.75rem] text-[#71767b]">
                  {formatNum(mostEngaged.totalEngagement)} total engagement
                </span>
              </button>
            )}
            {fastest && fastest.id !== mostEngaged?.id && (
              <button
                onClick={() => onStoryClick?.(fastest)}
                className="group w-full text-left rounded-lg hover:bg-white/4 -mx-2 px-2 py-1.5 transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <RiFlashlightFill className="text-amber-400" size={11} />
                  <span className="text-[0.625rem] font-semibold tracking-[0.12em] uppercase text-amber-400">
                    Fastest moving
                  </span>
                </div>
                <p className="text-[0.8125rem] font-semibold text-white leading-[1.3] mb-1 group-hover:text-[#e7e9ea] transition-colors">
                  {fastest.headline}
                </p>
                <span className="text-[0.75rem] text-[#71767b]">
                  {formatNum(fastest.velocity)}/hr
                </span>
              </button>
            )}
          </div>
          <Divider />
        </>
      )}

      {/* ── Pipeline status ── */}
      {status && (
        <>
          <SectionLabel>Pipeline</SectionLabel>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <LiveIndicator isRunning={status.isRunning} />
              <span className="text-[0.75rem] text-[#71767b]">
                {timeAgo(status.lastSuccessfulRunAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[0.75rem] text-[#71767b]">Active stories</span>
              <span className="text-[0.75rem] font-semibold text-white">
                {status.storyCount}
              </span>
            </div>
            {status.error && (
              <p className="text-[0.6875rem] text-red-400 leading-snug pt-1">
                {status.error}
              </p>
            )}
          </div>
        </>
      )}

      {/* Footer note */}
      <div className="mt-6 pt-5 border-t border-white/8">
        <p className="text-[0.6875rem] text-[#555] leading-relaxed">
          Stories clustered from live X conversations. Ranked by engagement, velocity, recency &amp; author diversity.
        </p>
      </div>
    </div>
  );
}

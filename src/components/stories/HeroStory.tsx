'use client';

import { Story } from '@/lib/types';
import { formatNum, timeAgo, getStoryLabel, getCategoryStyle, getBestTweetUrl, getHeroStat } from '@/lib/utils';
import { SourcesStrip } from './SourcesStrip';
import { HeroStatIcon } from './HeroStatIcon';
import { MediaGallery } from './MediaGallery';
import {
  RiBarChartHorizontalFill,
  RiArrowRightUpLine,
} from 'react-icons/ri';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { FaXTwitter } from 'react-icons/fa6';

interface Props {
  story: Story;
  onClick?: () => void;
  totalStories: number;
  medianVelocity: number;
}

export function HeroStory({ story, onClick, totalStories, medianVelocity }: Props) {
  const label = getStoryLabel(story, 0, totalStories, medianVelocity);
  const categoryStyle = getCategoryStyle(story.category);
  const tweetUrl = getBestTweetUrl(story);
  const heroStat = getHeroStat(story);

  return (
    <article
      className={`animate-fade-in-up ${onClick ? 'cursor-pointer group' : ''}`}
      onClick={onClick}
    >
      <div className="px-7 pt-7 pb-8 border-b border-white/[0.08]">
        {/* Label + Category + timestamp */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${label.dotClass}`} />
              <span
                className={`text-[0.625rem] font-semibold tracking-[0.16em] uppercase ${label.textClass}`}
              >
                {label.text}
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[0.625rem] font-semibold tracking-wide uppercase ${categoryStyle.bgClass} ${categoryStyle.textClass}`}
            >
              {categoryStyle.label}
            </span>
          </div>
          <span className="text-[0.6875rem] text-[#71767b]">{timeAgo(story.generatedAt)}</span>
        </div>

        {/* Editorial headline */}
        <h1 className="text-[3.25rem] font-black tracking-[-0.04em] leading-[1.03] text-white mb-5 group-hover:text-white/90 transition-colors duration-150">
          {story.headline}
        </h1>

        {/* Summary */}
        <p className="text-[1.0625rem] text-[#e7e9ea] leading-[1.7] mb-2">
          {story.summary}
        </p>

        {/* Media slideshow — right after summary */}
        <MediaGallery tweets={story.representativeTweets} />

        {/* Sources from X */}
        <SourcesStrip tweets={story.representativeTweets} />

        {/* Metrics row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-6">
          <div className="flex items-center gap-1.5">
            <RiBarChartHorizontalFill className="text-[#71767b]" size={12} />
            <span className="text-[0.75rem] text-[#71767b]">
              {formatNum(story.totalEngagement)} engagement
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <HeroStatIcon icon={heroStat.icon} size={12} />
            <span className="text-[0.75rem] text-[#71767b]">
              {heroStat.value} {heroStat.label}
            </span>
          </div>
          <AvatarStack
            tweets={story.representativeTweets}
            totalAuthors={story.uniqueAuthors}
            maxVisible={4}
            size={22}
          />
          <span className="text-[0.75rem] text-[#71767b]">{story.clusterSize} tweets</span>

          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto flex items-center gap-1.5 text-[0.8125rem] text-[#71767b] hover:text-white border border-white/[0.1] hover:border-white/[0.25] rounded-full px-3 py-1 transition-all duration-150 group"
          >
            <FaXTwitter size={11} />
            <span>View discussion</span>
            <RiArrowRightUpLine
              size={12}
              className="opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[12px] overflow-hidden transition-all duration-150"
            />
          </a>
        </div>
      </div>
    </article>
  );
}

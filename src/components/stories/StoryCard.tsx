'use client';

import { Story } from '@/lib/types';
import { timeAgo, getStoryLabel, getCategoryStyle, getBestTweetUrl, getHeroStat, getFirstImage } from '@/lib/utils';
import { TweetSnippet } from './TweetSnippet';
import { HeroStatIcon } from './HeroStatIcon';
import { RiArrowRightUpLine } from 'react-icons/ri';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { FaXTwitter } from 'react-icons/fa6';

interface Props {
  story: Story;
  index: number;
  onClick?: () => void;
  totalStories: number;
  medianVelocity: number;
}

export function StoryCard({ story, index, onClick, totalStories, medianVelocity }: Props) {
  const label = getStoryLabel(story, index, totalStories, medianVelocity);
  const categoryStyle = getCategoryStyle(story.category);
  const tweetUrl = getBestTweetUrl(story);
  const heroStat = getHeroStat(story);
  const firstImage = getFirstImage(story.representativeTweets);

  return (
    <article
      className={`px-6 py-5 border-b border-white/[0.08] hover:bg-white/[0.025] transition-colors duration-150 animate-fade-in-up ${onClick ? 'cursor-pointer' : ''}`}
      style={{ animationDelay: `${index * 55}ms` }}
      onClick={onClick}
    >
      {/* Label + Category + time */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${label.dotClass}`} />
            <span className={`text-[0.6875rem] font-semibold tracking-[0.12em] uppercase ${label.textClass}`}>
              {label.text}
            </span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[0.5625rem] font-semibold tracking-wide uppercase ${categoryStyle.bgClass} ${categoryStyle.textClass}`}
          >
            {categoryStyle.label}
          </span>
        </div>
        <span className="text-[0.75rem] text-[#71767b]">{timeAgo(story.generatedAt)}</span>
      </div>

      {/* Headline + image + summary (float wraps content around image) */}
      <div>
        {firstImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstImage}
            alt=""
            className="float-right ml-4 mb-2 rounded-lg max-w-[100px] max-h-[120px] w-auto h-auto"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Headline */}
        <h2 className="text-[1.0625rem] font-bold leading-[1.3] tracking-[-0.015em] text-white mb-2">
          {story.headline}
        </h2>

        {/* Summary */}
        <p className="text-[0.875rem] text-[#71767b] leading-[1.55] mb-3">
          {story.summary}
        </p>
      </div>

      {/* Compact tweet snippet */}
      {story.representativeTweets[0] && (
        <div className="mb-3">
          <TweetSnippet tweet={story.representativeTweets[0]} compact />
        </div>
      )}

      {/* Metrics + View on X */}
      <div className="flex items-center gap-4 pt-0.5">
        <div className="flex items-center gap-1">
          <HeroStatIcon icon={heroStat.icon} size={11} />
          <span className="text-[0.75rem] text-[#71767b]">{heroStat.value} {heroStat.label}</span>
        </div>
        <AvatarStack
          tweets={story.representativeTweets}
          totalAuthors={story.uniqueAuthors}
          maxVisible={3}
          size={18}
        />
        <span className="text-[0.75rem] text-[#71767b]">{story.clusterSize} tweets</span>

        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="ml-auto flex items-center gap-1 text-[0.75rem] text-[#71767b] hover:text-[#1d9bf0] transition-colors group"
        >
          <span>View on</span>
          <FaXTwitter size={10} />
          <RiArrowRightUpLine size={10} className="opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[10px] overflow-hidden transition-all duration-150" />
        </a>
      </div>
    </article>
  );
}

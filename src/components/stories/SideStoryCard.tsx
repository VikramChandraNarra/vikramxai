import { Story } from '@/lib/types';
import { timeAgo, getStoryLabel, getBestTweetUrl, getHeroStat } from '@/lib/utils';
import { HeroStatIcon } from './HeroStatIcon';
import { RiGroupFill, RiArrowRightUpLine } from 'react-icons/ri';
import { FaXTwitter } from 'react-icons/fa6';

interface Props {
  story: Story;
  index: number;
  totalStories: number;
  medianVelocity: number;
}

export function SideStoryCard({ story, index, totalStories, medianVelocity }: Props) {
  const label = getStoryLabel(story, index, totalStories, medianVelocity);
  const tweetUrl = getBestTweetUrl(story);
  const heroStat = getHeroStat(story);

  // Surface first media item (photo or video thumbnail) from any representative tweet
  const heroMedia = story.representativeTweets
    .flatMap((t) => t.media ?? [])
    .find((m) => m.url);

  return (
    <article
      className="py-5 border-b border-white/[0.08] last:border-b-0 hover:bg-white/[0.02] transition-colors duration-150 cursor-pointer animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Optional image */}
      {heroMedia && (
        <div className="mb-3 overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroMedia.url}
            alt=""
            className="w-full h-28 object-cover"
          />
        </div>
      )}

      {/* Label + time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${label.dotClass}`} />
          <span
            className={`text-[0.625rem] font-semibold tracking-[0.14em] uppercase ${label.textClass}`}
          >
            {label.text}
          </span>
        </div>
        <span className="text-[0.6875rem] text-[#71767b]">{timeAgo(story.generatedAt)}</span>
      </div>

      {/* Headline */}
      <h3 className="text-[0.9375rem] font-bold leading-[1.3] tracking-[-0.01em] text-white mb-1.5">
        {story.headline}
      </h3>

      {/* Summary */}
      <p className="text-[0.8125rem] text-[#71767b] leading-[1.5] mb-3">
        {story.summary}
      </p>

      {/* Metrics + View on X */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <HeroStatIcon icon={heroStat.icon} size={10} />
          <span className="text-[0.6875rem] text-[#71767b]">{heroStat.value} {heroStat.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <RiGroupFill className="text-[#71767b]" size={10} />
          <span className="text-[0.6875rem] text-[#71767b]">{story.uniqueAuthors}</span>
        </div>
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="ml-auto flex items-center gap-1 text-[0.6875rem] text-[#71767b] hover:text-[#1d9bf0] transition-colors group"
        >
          <span>View on</span>
          <FaXTwitter size={9} />
          <RiArrowRightUpLine
            size={9}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </a>
      </div>
    </article>
  );
}

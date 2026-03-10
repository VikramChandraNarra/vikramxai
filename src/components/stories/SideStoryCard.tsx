import { Story } from '@/lib/types';
import { formatNum, timeAgo, getStoryLabel } from '@/lib/utils';
import { RiFlashlightFill, RiGroupFill, RiArrowRightUpLine } from 'react-icons/ri';
import { FaXTwitter } from 'react-icons/fa6';

interface Props {
  story: Story;
  index: number;
}

export function SideStoryCard({ story, index }: Props) {
  const label = getStoryLabel(story);
  const searchUrl = `https://x.com/search?q=${encodeURIComponent(story.headline)}&src=typed_query&f=live`;

  // Surface first photo from any representative tweet
  const heroPhoto = story.representativeTweets
    .flatMap((t) => t.media ?? [])
    .find((m) => m.type === 'photo');

  return (
    <article
      className="py-5 border-b border-white/[0.08] last:border-b-0 hover:bg-white/[0.02] transition-colors duration-150 cursor-pointer animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Optional image */}
      {heroPhoto && (
        <div className="mb-3 overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroPhoto.url}
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
      <h3 className="text-[0.9375rem] font-bold leading-[1.3] tracking-[-0.01em] text-white mb-1.5 line-clamp-3">
        {story.headline}
      </h3>

      {/* Summary */}
      <p className="text-[0.8125rem] text-[#71767b] leading-[1.5] line-clamp-2 mb-3">
        {story.summary}
      </p>

      {/* Metrics + View on X */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <RiFlashlightFill className="text-[#71767b]" size={10} />
          <span className="text-[0.6875rem] text-[#71767b]">{formatNum(story.velocity)}/hr</span>
        </div>
        <div className="flex items-center gap-1">
          <RiGroupFill className="text-[#71767b]" size={10} />
          <span className="text-[0.6875rem] text-[#71767b]">{story.uniqueAuthors}</span>
        </div>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="ml-auto flex items-center gap-1 text-[0.6875rem] text-[#71767b] hover:text-[#1d9bf0] transition-colors group"
        >
          <FaXTwitter size={9} />
          <span>View on X</span>
          <RiArrowRightUpLine
            size={9}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </a>
      </div>
    </article>
  );
}

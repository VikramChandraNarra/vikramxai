import { Story } from '@/lib/types';
import { formatNum, timeAgo, getStoryLabel } from '@/lib/utils';
import { TweetSnippet } from './TweetSnippet';
import { RiFlashlightFill, RiGroupFill, RiBarChartHorizontalFill, RiArrowRightUpLine } from 'react-icons/ri';
import { FaXTwitter } from 'react-icons/fa6';

interface Props {
  story: Story;
}

export function HeroStory({ story }: Props) {
  const label = getStoryLabel(story);
  const searchUrl = `https://x.com/search?q=${encodeURIComponent(story.headline)}&src=typed_query&f=live`;

  return (
    <article className="px-6 pt-8 pb-7 border-b border-white/[0.08] animate-fade-in-up">
      {/* Label + timestamp row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${label.dotClass}`} />
          <span className={`text-[0.6875rem] font-semibold tracking-[0.12em] uppercase ${label.textClass}`}>
            {label.text}
          </span>
        </div>
        <span className="text-[0.75rem] text-[#71767b]">{timeAgo(story.generatedAt)}</span>
      </div>

      {/* Headline */}
      <h1 className="text-[2.25rem] font-black tracking-[-0.03em] leading-[1.08] text-white mb-4">
        {story.headline}
      </h1>

      {/* Summary */}
      <p className="text-[0.9375rem] text-[#e7e9ea] leading-[1.7] mb-7 max-w-[640px]">
        {story.summary}
      </p>

      {/* Tweet snippets */}
      {story.representativeTweets.length > 0 && (
        <div className="space-y-2 mb-6">
          {story.representativeTweets.slice(0, 3).map((tweet) => (
            <TweetSnippet key={tweet.id} tweet={tweet} />
          ))}
        </div>
      )}

      {/* Bottom bar: metrics + View on X */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2">
        <div className="flex items-center gap-1.5">
          <RiBarChartHorizontalFill className="text-[#71767b]" size={13} />
          <span className="text-[0.8125rem] text-[#71767b]">
            {formatNum(story.totalEngagement)} engagement
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <RiFlashlightFill className="text-[#71767b]" size={13} />
          <span className="text-[0.8125rem] text-[#71767b]">
            {formatNum(story.velocity)}/hr velocity
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <RiGroupFill className="text-[#71767b]" size={13} />
          <span className="text-[0.8125rem] text-[#71767b]">
            {story.uniqueAuthors} authors
          </span>
        </div>
        <span className="text-[0.8125rem] text-[#71767b]">{story.clusterSize} tweets</span>

        {/* View discussion on X */}
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 text-[0.8125rem] text-[#71767b] hover:text-white border border-white/[0.1] hover:border-white/[0.25] rounded-full px-3 py-1 transition-all duration-150 group"
        >
          <FaXTwitter size={11} />
          <span>View discussion</span>
          <RiArrowRightUpLine size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>
    </article>
  );
}

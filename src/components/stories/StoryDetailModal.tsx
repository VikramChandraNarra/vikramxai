'use client';

import { useEffect } from 'react';
import { Story } from '@/lib/types';
import { formatNum, timeAgo, getStoryLabel, getCategoryStyle, getBestTweetUrl, getHeroStat } from '@/lib/utils';
import { TweetSnippet } from './TweetSnippet';
import { AvatarStack } from '@/components/ui/AvatarStack';
import {
  RiCloseLine,
  RiBarChartHorizontalFill,
  RiGroupLine,
  RiArrowRightUpLine,
} from 'react-icons/ri';
import { HeroStatIcon } from './HeroStatIcon';
import { MediaGallery } from './MediaGallery';
import { FaXTwitter } from 'react-icons/fa6';

// Tweets visible before the conversion gate
const VISIBLE_TWEETS = 2;

const SIGNUP_URL = 'https://x.com/i/flow/signup';
const LOGIN_URL = 'https://x.com/i/flow/login';

interface Props {
  story: Story;
  onClose: () => void;
  storyIndex: number;
  totalStories: number;
  medianVelocity: number;
}

// ─── Conversion gate ─────────────────────────────────────────────────────────

function ConversionGate({ clusterSize }: { clusterSize: number }) {
  return (
    <div className="w-full max-w-xs mx-auto text-center px-4">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1d9bf0] opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1d9bf0]" />
        </span>
        <span className="text-[0.625rem] font-semibold tracking-[0.14em] uppercase text-[#1d9bf0]">
          Live on X
        </span>
      </div>
      <h3 className="text-[1.25rem] font-extrabold text-white tracking-[-0.025em] leading-[1.2] mb-2">
        Join the conversation.
      </h3>
      <p className="text-[0.8125rem] text-[#71767b] leading-[1.55] mb-5">
        See all {clusterSize} posts, reply, and follow this story as it develops in real time.
      </p>
      <div className="flex items-center justify-center gap-3">
        <a
          href={SIGNUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-white px-5 py-2.5 text-[0.875rem] font-bold text-black hover:bg-white/90 active:scale-[0.98] transition-all duration-150"
        >
          Sign up for X
        </a>
        <a
          href={LOGIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/15 px-5 py-2.5 text-[0.875rem] font-bold text-white hover:bg-white/6 active:scale-[0.98] transition-all duration-150"
        >
          Log in
        </a>
      </div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function StoryDetailModal({ story, onClose, storyIndex, totalStories, medianVelocity }: Props) {
  const label = getStoryLabel(story, storyIndex, totalStories, medianVelocity);
  const categoryStyle = getCategoryStyle(story.category);
  const tweetUrl = getBestTweetUrl(story);
  const heroStat = getHeroStat(story);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const visibleTweets = story.representativeTweets.slice(0, VISIBLE_TWEETS);
  const hiddenTweets = story.representativeTweets.slice(VISIBLE_TWEETS);
  const hasGate = hiddenTweets.length > 0;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm animate-modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Drawer panel ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={story.headline}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[620px] bg-black border-l border-white/[0.08] flex flex-col animate-modal-slide-in shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Sticky header ── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.08] flex-shrink-0 bg-black/95 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`px-2 py-0.5 rounded-full text-[0.5625rem] font-semibold tracking-wide uppercase flex-shrink-0 ${categoryStyle.bgClass} ${categoryStyle.textClass}`}
            >
              {categoryStyle.label}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`h-1.5 w-1.5 rounded-full ${label.dotClass}`} />
              <span className={`text-[0.5625rem] font-semibold tracking-[0.16em] uppercase ${label.textClass}`}>
                {label.text}
              </span>
            </div>
            <span className="text-[0.6875rem] text-[#71767b] truncate hidden sm:block">
              {timeAgo(story.generatedAt)}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close story detail"
            className="ml-3 p-2 rounded-full text-[#71767b] hover:text-white hover:bg-white/[0.08] active:bg-white/[0.12] transition-all duration-150 flex-shrink-0"
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Media slideshow */}
          <div className="px-7 pt-4">
            <MediaGallery tweets={story.representativeTweets} />
          </div>

          {/* ── Headline + summary ── */}
          <div className="px-7 pt-6 pb-5 border-b border-white/[0.08]">
            <h2 className="text-[1.875rem] font-black tracking-[-0.035em] leading-[1.1] text-white mb-3.5">
              {story.headline}
            </h2>
            <p className="text-[0.9375rem] text-[#e7e9ea] leading-[1.65]">
              {story.summary}
            </p>

            {/* Metrics row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <RiBarChartHorizontalFill className="text-[#71767b]" size={13} />
                <span className="text-[0.8125rem] text-[#71767b]">
                  {formatNum(story.totalEngagement)} engagement
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeroStatIcon icon={heroStat.icon} size={13} />
                <span className="text-[0.8125rem] text-[#71767b]">
                  {heroStat.value} {heroStat.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <RiGroupLine className="text-[#71767b]" size={13} />
                <span className="text-[0.8125rem] text-[#71767b]">
                  {story.uniqueAuthors} voices · {story.clusterSize} posts
                </span>
              </div>

              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1.5 text-[0.8125rem] text-[#71767b] hover:text-white border border-white/[0.1] hover:border-white/[0.25] rounded-full px-3.5 py-1.5 transition-all duration-150 group"
              >
                <span>View on</span>
                <FaXTwitter size={11} />
                <RiArrowRightUpLine
                  size={12}
                  className="opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[12px] overflow-hidden transition-all duration-150"
                />
              </a>
            </div>
          </div>

          {/* ── From X conversations ── */}
          <div className="px-7 pt-5">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-[#71767b]">
                From
              </span>
              <FaXTwitter className="text-[#71767b]" size={12} />
              <span className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-[#71767b]">
                conversations
              </span>
              <AvatarStack
                tweets={story.representativeTweets}
                totalAuthors={story.uniqueAuthors}
                maxVisible={5}
                size={18}
              />
            </div>

            {/* Visible tweets */}
            <div className="flex flex-col gap-3">
              {visibleTweets.map((tweet) => (
                <TweetSnippet key={tweet.id} tweet={tweet} hideMedia />
              ))}
            </div>

            {/* ── Conversion gate ── */}
            {hasGate ? (
              <div className="relative mt-3">
                {/* Blurred hidden tweets — decorative only, just first 2 */}
                <div
                  className="flex flex-col gap-3 select-none pointer-events-none"
                  aria-hidden="true"
                >
                  {hiddenTweets.slice(0, 2).map((tweet) => (
                    <div key={tweet.id} className="blur-[5px] opacity-50">
                      <TweetSnippet tweet={tweet} hideMedia />
                    </div>
                  ))}
                </div>

                {/* Fade + CTA — pinned to top so it sits over the first blurred tweet */}
                <div className="absolute inset-0 flex flex-col items-center justify-start pt-4 bg-gradient-to-b from-black/60 via-black/85 to-black">
                  <ConversionGate clusterSize={story.clusterSize} />
                </div>
              </div>
            ) : (
              <div className="pb-12" />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

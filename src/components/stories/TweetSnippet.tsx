'use client';

import { useState, useCallback } from 'react';
import { TweetPreview } from '@/lib/types';
import { formatNum, timeAgo } from '@/lib/utils';
import { FaXTwitter } from 'react-icons/fa6';
import { RiHeartLine, RiRepeat2Line, RiChat1Line, RiArrowRightUpLine } from 'react-icons/ri';

// ─── Avatar ──────────────────────────────────────────────────────────────────

interface AvatarProps {
  src?: string;
  username: string;
  size: number;
}

function Avatar({ src, username, size }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const initial = username.slice(0, 1).toUpperCase();
  const fontSize = Math.round(size * 0.38);

  if (src && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={username}
        width={size}
        height={size}
        onError={() => setErrored(true)}
        className="rounded-full object-cover bg-[#2a2a2a] flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-[#2a2a2a] flex items-center justify-center flex-shrink-0 text-[#71767b] font-bold select-none"
      style={{ width: size, height: size, fontSize }}
    >
      {initial}
    </div>
  );
}

// ─── Metric chip with logged-out tooltip ─────────────────────────────────────

function MetricChip({ icon, value }: { icon: React.ReactNode; value: number }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2400);
  }, []);

  if (value <= 0) return null;
  return (
    <span className="relative inline-flex items-center">
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1 text-[#71767b] hover:text-[#1d9bf0] transition-colors cursor-pointer"
      >
        {icon}
        <span className="text-[0.75rem]">{formatNum(value)}</span>
      </button>
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-lg bg-[#1d9bf0] px-3 py-1.5 text-[0.75rem] font-medium text-white shadow-lg animate-fade-in-up z-50">
          <a
            href="https://x.com/i/flow/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Sign up to join the conversation
          </a>
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#1d9bf0]" />
        </span>
      )}
    </span>
  );
}

// ─── Full tweet card (hero) ───────────────────────────────────────────────────

interface Props {
  tweet: TweetPreview;
  compact?: boolean;
}

function FullTweetCard({ tweet }: { tweet: TweetPreview }) {
  const tweetUrl = `https://x.com/${tweet.authorUsername}/status/${tweet.id}`;
  const profileUrl = `https://x.com/${tweet.authorUsername}`;
  const displayName = tweet.authorDisplayName || tweet.authorUsername;
  const photoMedia = tweet.media?.find((m) => m.type === 'photo');

  return (
    <div className="group rounded-xl border border-white/[0.08] hover:border-white/[0.18] hover:bg-white/[0.025] transition-all duration-150 overflow-hidden">
      <div className="p-3.5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          {/* Author identity */}
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 min-w-0 flex-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar
              src={tweet.authorProfileImageUrl}
              username={tweet.authorUsername}
              size={36}
            />
            <div className="min-w-0 leading-none">
              <div className="text-[0.875rem] font-bold text-white hover:underline truncate">
                {displayName}
              </div>
              <div className="text-[0.8125rem] text-[#71767b] mt-0.5 truncate">
                @{tweet.authorUsername}
                <span className="mx-1">·</span>
                {timeAgo(tweet.createdAt)}
              </div>
            </div>
          </a>

          {/* X logo + external link */}
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label="View on X"
            className="flex-shrink-0 flex items-center gap-1 p-1.5 rounded-lg text-[#71767b] hover:text-white hover:bg-white/[0.08] transition-all duration-150 group/link"
          >
            <FaXTwitter size={13} />
            <RiArrowRightUpLine size={12} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </a>
        </div>

        {/* Tweet text */}
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-2.5 pl-[44px]"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[0.9375rem] text-[#e7e9ea] leading-[1.5]">
            {tweet.text}
          </p>
        </a>

        {/* Metrics row */}
        <div className="flex items-center gap-5 mt-3 pl-[44px]">
          <MetricChip
            icon={<RiChat1Line size={14} />}
            value={tweet.replyCount ?? 0}
          />
          <MetricChip
            icon={<RiRepeat2Line size={14} />}
            value={tweet.retweetCount}
          />
          <MetricChip
            icon={<RiHeartLine size={14} />}
            value={tweet.likeCount}
          />
        </div>
      </div>

      {/* Media image — full bleed below content */}
      {photoMedia && (
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="block border-t border-white/[0.06]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoMedia.url}
            alt="Tweet media"
            className="w-full object-cover max-h-[280px] hover:opacity-90 transition-opacity"
          />
        </a>
      )}
    </div>
  );
}

// ─── Compact tweet row (story cards) ─────────────────────────────────────────

function CompactTweetRow({ tweet }: { tweet: TweetPreview }) {
  const tweetUrl = `https://x.com/${tweet.authorUsername}/status/${tweet.id}`;

  return (
    <a
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-2 border-l-2 border-white/[0.1] hover:border-[#1d9bf0]/40 pl-3 py-1 transition-colors duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      <Avatar
        src={tweet.authorProfileImageUrl}
        username={tweet.authorUsername}
        size={20}
      />
      <p className="text-[0.8125rem] text-[#71767b] leading-[1.45] line-clamp-2 group-hover:text-[#e7e9ea] transition-colors duration-150">
        <span className="font-semibold text-[#e7e9ea]/70 mr-1">
          @{tweet.authorUsername}
        </span>
        {tweet.text}
      </p>
    </a>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function TweetSnippet({ tweet, compact = false }: Props) {
  if (compact) return <CompactTweetRow tweet={tweet} />;
  return <FullTweetCard tweet={tweet} />;
}

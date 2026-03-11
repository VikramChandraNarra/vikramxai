'use client';

import Image from 'next/image';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { RiRefreshLine } from 'react-icons/ri';
import { timeAgo } from '@/lib/utils';

const SIGNUP_URL = 'https://x.com/i/flow/signup';
const LOGIN_URL = 'https://x.com/i/flow/login';

interface Props {
  isRunning: boolean;
  isRefreshing: boolean;
  isIngesting: boolean;
  lastFetched: Date | null;
  onRefresh: () => void;
  onIngest: () => void;
}

export function TopNav({ isRunning, isRefreshing, isIngesting, lastFetched, onRefresh, onIngest }: Props) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <nav className="sticky top-0 z-30 h-14 border-b border-white/8 bg-black/92 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto h-full flex items-center px-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
            <Image
              src="/new-2023-twitter-logo-x-icon-design_1017-45418.avif"
              alt="X"
              width={32}
              height={32}
              className="object-cover"
              priority
            />
          </div>
          <span className="text-[1rem] font-extrabold text-white tracking-[-0.015em]">
            AI Stories
          </span>
          <span className="text-[#71767b] leading-none">·</span>
          <LiveIndicator isRunning={isRunning} />
        </div>

        <div className="flex-1 text-center">
          <span className="text-[0.8125rem] text-[#71767b]">{today}</span>
        </div>

        <div className="flex items-center gap-3">
          {lastFetched && (
            <span className="text-[0.75rem] text-[#71767b]">
              {timeAgo(lastFetched.toISOString())}
            </span>
          )}
          {process.env.NEXT_PUBLIC_APP_ENV !== 'prod' && (
            <button
              onClick={onIngest}
              disabled={isIngesting || isRefreshing}
              aria-label="Fetch tweets from X API"
              className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[0.6875rem] font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-40"
            >
              {isIngesting ? 'Fetching…' : 'Fetch Tweets'}
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh stories"
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.75rem] font-medium transition-all duration-200 ${
              isRefreshing
                ? 'bg-[#1d9bf0]/10 text-[#1d9bf0]'
                : 'hover:bg-white/8 text-[#71767b] hover:text-white'
            }`}
          >
            <RiRefreshLine className={isRefreshing ? 'animate-spin' : ''} size={14} />
            {isRefreshing && <span>Updating</span>}
          </button>
          <span className="w-px h-4 bg-white/10" />
          <a
            href={LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.875rem] font-bold text-white hover:text-white/70 transition-colors"
          >
            Log in
          </a>
          <a
            href={SIGNUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-white px-4 py-1.5 text-[0.875rem] font-bold text-black hover:bg-white/90 active:scale-[0.97] transition-all duration-150"
          >
            Sign up
          </a>
        </div>
      </div>
    </nav>
  );
}

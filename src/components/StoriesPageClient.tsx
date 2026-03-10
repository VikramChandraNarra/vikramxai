'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Story } from '@/lib/types';
import { timeAgo } from '@/lib/utils';
import { LeftRail } from '@/components/layout/LeftRail';
import { RightRail } from '@/components/layout/RightRail';
import { HeroStory } from '@/components/stories/HeroStory';
import { StoryCard } from '@/components/stories/StoryCard';
import { SkeletonFeed } from '@/components/ui/SkeletonFeed';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { RiRefreshLine } from 'react-icons/ri';

// ─── Splash screen ──────────────────────────────────────────────────────────

type SplashPhase = 'hold' | 'exit' | 'done';

function SplashScreen({ phase }: { phase: SplashPhase }) {
  if (phase === 'done') return null;

  const isExiting = phase === 'exit';

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      style={isExiting ? {
        animation: 'splash-fade-out 0.5s ease-in forwards',
        pointerEvents: 'none',
      } : undefined}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={isExiting ? {
          animation: 'splash-logo-settle 0.5s ease-in forwards',
        } : {
          transform: 'translate(-50%, -50%)',
          animation: 'splash-logo-pulse 1.6s ease-in-out infinite',
        }}
      >
        <Image
          src="/new-2023-twitter-logo-x-icon-design_1017-45418.avif"
          alt="X"
          width={64}
          height={64}
          className="object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.12)]"
          priority
        />
      </div>
    </div>
  );
}

interface PipelineStatus {
  isRunning: boolean;
  lastRunAt: string | null;
  lastSuccessfulRunAt: string | null;
  error: string | null;
  storyCount: number;
  cacheAgeMs: number | null;
}

interface StoriesData {
  headlineStory: Story | null;
  stories: Story[];
  status: PipelineStatus;
}

const POLL_MS = 30_000;
const SIGNUP_URL = 'https://x.com/i/flow/signup';
const LOGIN_URL = 'https://x.com/i/flow/login';
const VISIBLE_STORY_COUNT = 3;

// ─── FOMO gate overlay ──────────────────────────────────────────────────────

function FeedGate({ remainingCount }: { remainingCount: number }) {
  return (
    <div className="relative">
      {/* Blurred teaser rows behind the overlay */}
      <div
        className="pointer-events-none select-none"
        style={{ filter: 'blur(6px)', WebkitFilter: 'blur(6px)' }}
        aria-hidden="true"
      >
        {Array.from({ length: Math.min(remainingCount, 4) }).map((_, i) => (
          <div
            key={i}
            className="px-6 py-5 border-b border-white/[0.08]"
            style={{ opacity: 1 - i * 0.2 }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#71767b]" />
                <span className="text-[0.6875rem] font-semibold tracking-[0.12em] uppercase text-[#71767b]">
                  Developing
                </span>
              </div>
              <span className="text-[0.75rem] text-[#71767b]">just now</span>
            </div>
            <div className="h-5 w-4/5 rounded bg-white/[0.06] mb-2" />
            <div className="h-4 w-3/5 rounded bg-white/[0.04] mb-3" />
            <div className="flex items-start gap-2 border-l-2 border-white/[0.1] pl-3 py-1">
              <div className="h-5 w-5 rounded-full bg-[#2a2a2a] flex-shrink-0" />
              <div className="h-3 w-48 rounded bg-white/[0.04]" />
            </div>
          </div>
        ))}
      </div>

      {/* Gradient fade into black at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />

      {/* Conversion overlay card */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="w-full max-w-[380px] rounded-2xl border border-white/[0.12] bg-black/80 backdrop-blur-xl shadow-2xl shadow-black/60 px-8 py-8 text-center animate-fade-in-up">
          {/* Pulsing live dot */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1d9bf0] opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1d9bf0]" />
            </span>
            <span className="text-[0.6875rem] font-semibold tracking-[0.12em] uppercase text-[#1d9bf0]">
              More stories unfolding right now
            </span>
          </div>

          <h3 className="text-[1.375rem] font-extrabold text-white tracking-[-0.02em] leading-[1.15] mb-2">
            Join the conversation.
          </h3>
          <p className="text-[0.875rem] text-[#71767b] leading-[1.55] mb-6">
            Discover more stories as they emerge across X.
          </p>

          <div className="flex flex-col gap-2.5">
            <a
              href={SIGNUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-full bg-white py-2.5 text-center text-[0.9375rem] font-bold text-black hover:bg-white/90 active:scale-[0.98] transition-all duration-150"
            >
              Sign up for X
            </a>
            <a
              href={LOGIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-full border border-white/[0.2] py-2.5 text-center text-[0.9375rem] font-bold text-white hover:bg-white/[0.06] active:scale-[0.98] transition-all duration-150"
            >
              Log in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty / Error states ────────────────────────────────────────────────────

function EmptyState({ isRunning }: { isRunning: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-32 text-center">
      <div className="relative mb-6">
        <div className="h-12 w-12 rounded-full border border-white/[0.1] flex items-center justify-center">
          <RiRefreshLine
            className={`text-[#71767b] ${isRunning ? 'animate-spin' : ''}`}
            size={22}
          />
        </div>
        {isRunning && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
          </span>
        )}
      </div>
      <h2 className="text-[1.125rem] font-bold text-white mb-2 tracking-[-0.01em]">
        {isRunning ? 'Intelligence loading' : 'No stories yet'}
      </h2>
      <p className="text-[0.875rem] text-[#71767b] max-w-[280px] leading-relaxed">
        {isRunning
          ? 'The pipeline is ingesting live conversations and clustering stories. This takes about 30–60 seconds.'
          : 'Trigger a refresh to start generating stories from live X conversations.'}
      </p>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-32 text-center">
      <div className="h-12 w-12 rounded-full border border-red-500/20 bg-red-500/[0.06] flex items-center justify-center mb-5">
        <span className="text-red-400 text-xl font-bold">!</span>
      </div>
      <h2 className="text-[1.125rem] font-bold text-white mb-2">Something went wrong</h2>
      <p className="text-[0.8125rem] text-[#71767b] mb-6 max-w-[300px] font-mono leading-relaxed">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="rounded-full border border-white/[0.15] px-5 py-2.5 text-[0.875rem] font-semibold text-white hover:bg-white/[0.06] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function StoriesPageClient() {
  const [splash, setSplash] = useState<SplashPhase>('hold');
  const [data, setData] = useState<StoriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const holdTimer = setTimeout(() => setSplash('exit'), 2000);
    const doneTimer = setTimeout(() => setSplash('done'), 2500);
    return () => { clearTimeout(holdTimer); clearTimeout(doneTimer); };
  }, []);

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch('/api/stories');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: StoriesData = await res.json();
      setData(json);
      setLastFetched(new Date());
      setFetchError(null);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load stories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
    const pollTimer = setInterval(fetchStories, POLL_MS);
    const tickTimer = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => {
      clearInterval(pollTimer);
      clearInterval(tickTimer);
    };
  }, [fetchStories]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetch('/api/stories/refresh', { method: 'POST' });
    } catch {
      // ignore — still re-fetch
    }
    await fetchStories();
  }, [fetchStories]);

  void tick;

  const isRunning = data?.status?.isRunning ?? false;
  const hasContent = !!data?.headlineStory;

  const visibleStories = data?.stories.slice(0, VISIBLE_STORY_COUNT) ?? [];
  const hiddenCount = Math.max((data?.stories.length ?? 0) - VISIBLE_STORY_COUNT, 0);

  return (
    <>
      <SplashScreen phase={splash} />
      <LeftRail onRefresh={handleRefresh} isRefreshing={refreshing} />

      {/* Center column */}
      <div className="ml-[275px] mr-[350px] min-h-screen">
        {/* Sticky feed header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 bg-black/85 backdrop-blur-md border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <span className="text-[1.0625rem] font-extrabold text-white tracking-[-0.01em]">
              Stories
            </span>
            <LiveIndicator isRunning={isRunning} />
          </div>
          <div className="flex items-center gap-3">
            {lastFetched && (
              <span className="text-[0.75rem] text-[#71767b]">
                Updated {timeAgo(lastFetched.toISOString())}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh stories"
              className="p-2 rounded-full hover:bg-white/[0.08] transition-colors text-[#71767b] hover:text-white disabled:opacity-40"
            >
              <RiRefreshLine
                className={refreshing ? 'animate-spin' : ''}
                size={17}
              />
            </button>
            <span className="w-px h-5 bg-white/[0.1]" />
            <a
              href={LOGIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.875rem] font-bold text-white hover:text-white/80 transition-colors"
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

        {/* Content area */}
        {loading ? (
          <SkeletonFeed />
        ) : fetchError ? (
          <ErrorState error={fetchError} onRetry={() => { setLoading(true); fetchStories(); }} />
        ) : !hasContent ? (
          <EmptyState isRunning={isRunning} />
        ) : (
          <>
            <HeroStory story={data!.headlineStory!} />

            {/* Visible story cards */}
            {visibleStories.length > 0 && (
              <div>
                <div className="px-6 py-3 border-b border-white/[0.08]">
                  <span className="text-[0.6875rem] font-semibold tracking-[0.12em] uppercase text-[#71767b]">
                    More stories
                  </span>
                </div>
                {visibleStories.map((story, i) => (
                  <StoryCard key={story.id} story={story} index={i} />
                ))}
              </div>
            )}

            {/* FOMO gate — blurred stories + conversion overlay */}
            {hiddenCount > 0 && <FeedGate remainingCount={hiddenCount} />}

            <div className="h-20" />
          </>
        )}
      </div>

      <RightRail
        status={data?.status ?? null}
        stories={data?.stories ?? []}
        headlineStory={data?.headlineStory ?? null}
        lastFetched={lastFetched}
      />
    </>
  );
}

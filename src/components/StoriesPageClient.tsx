'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Story } from '@/lib/types';
import { TopNav } from '@/components/layout/TopNav';
import { RightPanel } from '@/components/layout/RightPanel';
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

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Constants ───────────────────────────────────────────────────────────────

const POLL_MS = 30_000;
const REFRESH_POLL_MS = 2_500;
const SIGNUP_URL = 'https://x.com/i/flow/signup';
const LOGIN_URL = 'https://x.com/i/flow/login';
const CTA_AFTER = 8;

// ─── Inline CTA (appears mid-feed after scrolling) ──────────────────────────

function InlineCta() {
  return (
    <div className="col-span-2 border-b border-white/8 bg-white/2">
      <div className="max-w-md mx-auto px-6 py-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1d9bf0] opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1d9bf0]" />
          </span>
          <span className="text-[0.625rem] font-semibold tracking-[0.14em] uppercase text-[#1d9bf0]">
            Live stories
          </span>
        </div>
        <h3 className="text-[1.125rem] font-extrabold text-white tracking-[-0.02em] leading-[1.2] mb-1.5">
          Follow every story as it breaks.
        </h3>
        <p className="text-[0.8125rem] text-[#71767b] leading-[1.55] mb-5">
          Join X to get real-time updates, see the full conversation, and never miss a developing story.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a
            href={SIGNUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-white px-6 py-2.5 text-[0.875rem] font-bold text-black hover:bg-white/90 active:scale-[0.98] transition-all duration-150"
          >
            Sign up for X
          </a>
          <a
            href={LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/15 px-6 py-2.5 text-[0.875rem] font-bold text-white hover:bg-white/6 active:scale-[0.98] transition-all duration-150"
          >
            Log in
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Empty / Error states ────────────────────────────────────────────────────

function EmptyState({ isRunning }: { isRunning: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-32 text-center">
      <div className="relative mb-6">
        <div className="h-12 w-12 rounded-full border border-white/10 flex items-center justify-center">
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
      <p className="text-[0.875rem] text-[#71767b] max-w-[260px] leading-relaxed">
        {isRunning
          ? 'The pipeline is ingesting live conversations and clustering stories. This takes about 30\u201360 seconds.'
          : 'Trigger a refresh to start generating stories from live X conversations.'}
      </p>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-32 text-center">
      <div className="h-12 w-12 rounded-full border border-red-500/20 bg-red-500/6 flex items-center justify-center mb-5">
        <span className="text-red-400 text-xl font-bold">!</span>
      </div>
      <h2 className="text-[1.125rem] font-bold text-white mb-2">Something went wrong</h2>
      <p className="text-[0.8125rem] text-[#71767b] mb-6 max-w-[280px] font-mono leading-relaxed">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="rounded-full border border-white/15 px-5 py-2.5 text-[0.875rem] font-semibold text-white hover:bg-white/6 transition-colors"
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

  const refreshPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRefreshPoll = useCallback(() => {
    if (refreshPollRef.current) {
      clearInterval(refreshPollRef.current);
      refreshPollRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchStories();
    const pollTimer = setInterval(fetchStories, POLL_MS);
    const tickTimer = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => {
      clearInterval(pollTimer);
      clearInterval(tickTimer);
      stopRefreshPoll();
    };
  }, [fetchStories, stopRefreshPoll]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    stopRefreshPoll();
    try {
      await fetch('/api/stories/refresh', { method: 'POST' });
    } catch {
      // ignore
    }

    refreshPollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/stories');
        if (!res.ok) return;
        const json: StoriesData = await res.json();
        setData(json);
        setLastFetched(new Date());
        setFetchError(null);

        if (!json.status?.isRunning) {
          setRefreshing(false);
          stopRefreshPoll();
        }
      } catch {
        // keep polling
      }
    }, REFRESH_POLL_MS);
  }, [stopRefreshPoll]);

  void tick;

  const isRunning = data?.status?.isRunning ?? false;
  const hasContent = !!data?.headlineStory;
  const allStories = data?.stories ?? [];

  return (
    <>
      <SplashScreen phase={splash} />

      <TopNav
        isRunning={isRunning}
        isRefreshing={refreshing}
        lastFetched={lastFetched}
        onRefresh={handleRefresh}
      />

      <main className="w-full max-w-[1400px] mx-auto px-3">
        {loading ? (
          <SkeletonFeed />
        ) : fetchError ? (
          <ErrorState
            error={fetchError}
            onRetry={() => { setLoading(true); fetchStories(); }}
          />
        ) : !hasContent ? (
          <EmptyState isRunning={isRunning} />
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)_260px]">
            {/* ── Main content ── */}
            <div className="min-w-0">
              {/* Hero */}
              <HeroStory story={data!.headlineStory!} />

              {/* Section header */}
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/8">
                <span className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-[#71767b]">
                  More stories
                </span>
                <LiveIndicator isRunning={isRunning} />
              </div>

              {/* Two-column story grid — visible stories */}
              <div className="grid grid-cols-2">
                {allStories.slice(0, CTA_AFTER).map((story, i) => (
                  <div key={story.id} className={i % 2 === 0 ? 'border-r border-white/8' : ''}>
                    <StoryCard story={story} index={i} />
                  </div>
                ))}
              </div>

              {/* Fade-out teaser + CTA */}
              {allStories.length > CTA_AFTER && (
                <div className="relative">
                  <div className="grid grid-cols-2 overflow-hidden max-h-[420px]">
                    {allStories.slice(CTA_AFTER, CTA_AFTER + 4).map((story, i) => (
                      <div key={story.id} className={i % 2 === 0 ? 'border-r border-white/8' : ''}>
                        <StoryCard story={story} index={CTA_AFTER + i} />
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-transparent via-black/70 to-black" />
                  <div className="relative -mt-4">
                    <InlineCta />
                  </div>
                </div>
              )}

              <div className="h-16" />
            </div>

            {/* ── Right sidebar ── */}
            <div className="sticky top-14 h-[calc(100vh-56px)] overflow-y-auto border-l border-white/8 min-w-0">
              <RightPanel
                status={data?.status ?? null}
                stories={allStories}
                headlineStory={data?.headlineStory ?? null}
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}


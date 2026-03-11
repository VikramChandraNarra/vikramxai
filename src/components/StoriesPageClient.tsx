'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import { Story } from '@/lib/types';
import { computeMedianVelocity } from '@/lib/utils';
import { TopNav } from '@/components/layout/TopNav';
import { RightPanel } from '@/components/layout/RightPanel';
import { HeroStory } from '@/components/stories/HeroStory';
import { StoryCard } from '@/components/stories/StoryCard';
import { StoryDetailModal } from '@/components/stories/StoryDetailModal';
import { SkeletonFeed } from '@/components/ui/SkeletonFeed';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { RiRefreshLine, RiArrowUpLine } from 'react-icons/ri';
import { TweetPreview } from '@/lib/types';

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
    <div className="col-span-1 sm:col-span-2 border-b border-white/8 bg-white/2">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-10 text-center">
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

// ─── "New tweets" floating toast ─────────────────────────────────────────────

function NewTweetsPill({
  tweets,
  visible,
  onClick,
}: {
  tweets: TweetPreview[];
  visible: boolean;
  onClick: () => void;
}) {
  // Deduplicate authors and pick up to 3
  const seen = new Set<string>();
  const avatars: { username: string; src?: string }[] = [];
  for (const t of tweets) {
    const key = t.authorUsername.toLowerCase();
    if (!seen.has(key) && avatars.length < 3) {
      seen.add(key);
      avatars.push({ username: t.authorUsername, src: t.authorProfileImageUrl });
    }
  }

  if (avatars.length === 0) return null;

  return (
    <button
      onClick={onClick}
      className={`fixed top-[68px] left-1/2 -translate-x-1/2 z-35 flex items-center gap-2 rounded-full bg-[#1d9bf0] pl-3 pr-4 py-2 shadow-lg shadow-[#1d9bf0]/25 cursor-pointer transition-all duration-300 hover:bg-[#1a8cd8] active:scale-95 ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
    >
      <RiArrowUpLine size={14} className="text-white" />
      <div className="flex items-center -space-x-1.5">
        {avatars.map((a) => (
          <div
            key={a.username}
            className="h-[22px] w-[22px] rounded-full border-2 border-[#1d9bf0] bg-[#2a2a2a] overflow-hidden shrink-0"
          >
            {a.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.src} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-[0.5rem] font-bold text-white">
                {a.username.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        ))}
      </div>
      <span className="text-[0.8125rem] font-bold text-white">Tweeted</span>
    </button>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function StoriesPageClient() {
  const [splash, setSplash] = useState<SplashPhase>('hold');
  const [data, setData] = useState<StoriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showTweetsPill, setShowTweetsPill] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const pillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pillShownRef = useRef(false);

  useEffect(() => {
    const holdTimer = setTimeout(() => setSplash('exit'), 2000);
    const doneTimer = setTimeout(() => setSplash('done'), 2500);
    return () => { clearTimeout(holdTimer); clearTimeout(doneTimer); };
  }, []);

  const fetchStories = useCallback(async (shuffle = false) => {
    try {
      const url = shuffle ? '/api/stories?shuffle' : '/api/stories';
      const res = await fetch(url);
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

  const ingestPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopIngestPoll = useCallback(() => {
    if (ingestPollRef.current) {
      clearInterval(ingestPollRef.current);
      ingestPollRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchStories();
    const pollTimer = setInterval(fetchStories, POLL_MS);
    const tickTimer = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => {
      clearInterval(pollTimer);
      clearInterval(tickTimer);
      stopIngestPoll();
    };
  }, [fetchStories, stopIngestPoll]);

  // "New tweets" pill — appears after user scrolls past hero and stays 10s
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const pastHero = !entry.isIntersecting;
        if (pastHero && !pillShownRef.current) {
          // Start 10s timer when hero scrolls out of view
          pillTimerRef.current = setTimeout(() => {
            setShowTweetsPill(true);
            pillShownRef.current = true;
          }, 10_000);
        } else if (!pastHero) {
          // Hero is back in view — cancel timer, hide pill
          if (pillTimerRef.current) {
            clearTimeout(pillTimerRef.current);
            pillTimerRef.current = null;
          }
          setShowTweetsPill(false);
        }
      },
      { threshold: 0 },
    );

    observer.observe(hero);
    return () => {
      observer.disconnect();
      if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
    };
  }, [!!data?.headlineStory]); // eslint-disable-line react-hooks/exhaustive-deps

  // refreshKey changes on every refresh — forces React to remount story
  // components so entry animations replay, creating a "fresh feed" feel.
  const [refreshKey, setRefreshKey] = useState(0);
  const [feedPhase, setFeedPhase] = useState<'visible' | 'out' | 'skeleton' | 'in'>('visible');

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    // Phase 1: fade out current content
    setFeedPhase('out');
    await new Promise((r) => setTimeout(r, 200));

    // Phase 2: brief skeleton shimmer (perception of loading)
    setFeedPhase('skeleton');
    const fetchPromise = fetchStories(true);
    await Promise.all([fetchPromise, new Promise((r) => setTimeout(r, 400))]);

    // Phase 3: scroll to top + bump key to remount (replays stagger animations)
    window.scrollTo({ top: 0, behavior: 'instant' });
    setShowTweetsPill(false);
    pillShownRef.current = false;
    setRefreshKey((k) => k + 1);
    setFeedPhase('in');
    setRefreshing(false);

    // Reset phase after entrance animation completes
    setTimeout(() => setFeedPhase('visible'), 500);
  }, [fetchStories]);

  const handleIngest = useCallback(async () => {
    setIngesting(true);
    stopIngestPoll();
    try {
      await fetch('/api/stories/ingest', { method: 'POST' });
    } catch {
      // ignore
    }

    ingestPollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/stories');
        if (!res.ok) return;
        const json: StoriesData = await res.json();
        setData(json);
        setLastFetched(new Date());
        setFetchError(null);

        if (!json.status?.isRunning) {
          setIngesting(false);
          stopIngestPoll();
        }
      } catch {
        // keep polling
      }
    }, REFRESH_POLL_MS);
  }, [stopIngestPoll]);

  void tick;

  const isRunning = data?.status?.isRunning ?? false;
  const hasContent = !!data?.headlineStory;
  const allStories = data?.stories ?? [];

  // Rank-relative label helpers — computed once from the full story list
  const allStoriesFlat = useMemo(
    () => (data?.headlineStory ? [data.headlineStory, ...allStories] : allStories),
    [data?.headlineStory, allStories],
  );
  const totalStories = allStoriesFlat.length;
  const medianVelocity = useMemo(() => computeMedianVelocity(allStoriesFlat), [allStoriesFlat]);

  // Resolve selected story's rank index for the modal label
  const selectedStoryIndex = useMemo(() => {
    if (!selectedStory) return 0;
    const idx = allStoriesFlat.findIndex((s) => s.id === selectedStory.id);
    return idx === -1 ? 0 : idx;
  }, [selectedStory, allStoriesFlat]);

  return (
    <>
      <SplashScreen phase={splash} />

      <TopNav
        isRunning={isRunning}
        isRefreshing={refreshing}
        isIngesting={ingesting}
        lastFetched={lastFetched}
        onRefresh={handleRefresh}
        onIngest={handleIngest}
      />

      {/* "New tweets" pill — appears after scrolling past hero for 10s */}
      {data?.headlineStory && (
        <NewTweetsPill
          tweets={data.headlineStory.representativeTweets}
          visible={showTweetsPill}
          onClick={() => {
            setShowTweetsPill(false);
            handleRefresh();
          }}
        />
      )}

      <main className="w-full max-w-[1400px] mx-auto px-0 sm:px-3">
        {loading ? (
          <SkeletonFeed />
        ) : fetchError ? (
          <ErrorState
            error={fetchError}
            onRetry={() => { setLoading(true); fetchStories(); }}
          />
        ) : !hasContent ? (
          <EmptyState isRunning={isRunning} />
        ) : feedPhase === 'skeleton' ? (
          <SkeletonFeed />
        ) : (
          <div
            key={refreshKey}
            className={`grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] transition-opacity duration-200 ${
              feedPhase === 'out' ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {/* ── Main content ── */}
            <div className="min-w-0">
              {/* Hero */}
              <div ref={heroRef}>
                <HeroStory
                  story={data!.headlineStory!}
                  onClick={() => setSelectedStory(data!.headlineStory!)}
                  totalStories={totalStories}
                  medianVelocity={medianVelocity}
                />
              </div>

              {/* Section header */}
              <div className="flex items-center gap-2.5 px-4 sm:px-6 py-4 border-b border-white/8">
                <span className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-[#71767b]">
                  More stories
                </span>
                <LiveIndicator isRunning={isRunning} />
              </div>

              {/* Story grid — single column on mobile, two columns on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {allStories.slice(0, CTA_AFTER).map((story, i) => (
                  <div key={story.id} className={i % 2 === 0 ? 'sm:border-r border-white/8' : ''}>
                    <StoryCard story={story} index={i + 1} onClick={() => setSelectedStory(story)} totalStories={totalStories} medianVelocity={medianVelocity} />
                  </div>
                ))}
              </div>

              {/* Fade-out teaser + CTA */}
              {allStories.length > CTA_AFTER && (
                <div className="relative">
                  <div className="grid grid-cols-1 sm:grid-cols-2 overflow-hidden max-h-[420px]">
                    {allStories.slice(CTA_AFTER, CTA_AFTER + 4).map((story, i) => (
                      <div key={story.id} className={i % 2 === 0 ? 'sm:border-r border-white/8' : ''}>
                        <StoryCard story={story} index={CTA_AFTER + i + 1} onClick={() => setSelectedStory(story)} totalStories={totalStories} medianVelocity={medianVelocity} />
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

            {/* ── Right sidebar — hidden on mobile/tablet ── */}
            <div className="hidden lg:block sticky top-14 h-[calc(100vh-56px)] overflow-y-auto border-l border-white/8 min-w-0">
              <RightPanel
                status={data?.status ?? null}
                stories={allStories}
                headlineStory={data?.headlineStory ?? null}
                onStoryClick={setSelectedStory}
              />
            </div>
          </div>
        )}
      </main>

      {/* ── Story detail modal ── */}
      {selectedStory && (
        <StoryDetailModal
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
          storyIndex={selectedStoryIndex}
          totalStories={totalStories}
          medianVelocity={medianVelocity}
        />
      )}
    </>
  );
}


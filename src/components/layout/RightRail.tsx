import { Story } from '@/lib/types';
import { formatNum, timeAgo } from '@/lib/utils';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { RiFlashlightFill, RiGroupFill, RiBarChartHorizontalFill } from 'react-icons/ri';

const SIGNUP_URL = 'https://x.com/i/flow/signup';
const LOGIN_URL = 'https://x.com/i/flow/login';

interface PipelineStatus {
  isRunning: boolean;
  lastRunAt: string | null;
  lastSuccessfulRunAt: string | null;
  error: string | null;
  storyCount: number;
  cacheAgeMs: number | null;
}

interface Props {
  status: PipelineStatus | null;
  stories: Story[];
  headlineStory: Story | null;
  lastFetched: Date | null;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#080808] overflow-hidden">
      {children}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
      <h3 className="text-[1rem] font-extrabold text-white tracking-[-0.01em]">{title}</h3>
    </div>
  );
}

export function RightRail({ status, stories, headlineStory, lastFetched }: Props) {
  const topStories = headlineStory ? [headlineStory, ...stories] : stories;

  return (
    <aside className="fixed right-0 top-0 h-screen w-[350px] flex flex-col border-l border-white/[0.08] px-4 py-4 gap-4 overflow-y-auto z-20">

      {/* ── Join the conversation ── */}
      <SectionCard>
        <div className="px-4 pt-5 pb-5">
          <h3 className="text-[1.1875rem] font-extrabold text-white tracking-[-0.02em] leading-[1.2] mb-2">
            Join the conversation
          </h3>
          <p className="text-[0.8125rem] text-[#71767b] leading-[1.55] mb-4">
            Follow stories as they emerge, see live discussions, and discover what&apos;s happening in real time.
          </p>
          <div className="flex flex-col gap-2.5">
            <a
              href={SIGNUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-full bg-white py-2.5 text-center text-[0.9375rem] font-bold text-black hover:bg-white/90 active:scale-[0.98] transition-all duration-150"
            >
              Sign up
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
      </SectionCard>

      {/* Pipeline status */}
      <SectionCard>
        <SectionHeader title="Pipeline Status" />
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <LiveIndicator isRunning={status?.isRunning ?? false} />
            {lastFetched && (
              <span className="text-[0.75rem] text-[#71767b]">
                {timeAgo(lastFetched.toISOString())}
              </span>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[0.8125rem] text-[#71767b]">Active stories</span>
              <span className="text-[0.8125rem] font-semibold text-white">
                {status?.storyCount ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[0.8125rem] text-[#71767b]">Last success</span>
              <span className="text-[0.8125rem] text-white">
                {timeAgo(status?.lastSuccessfulRunAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[0.8125rem] text-[#71767b]">Cache age</span>
              <span className="text-[0.8125rem] text-white">
                {status?.cacheAgeMs != null
                  ? `${Math.floor(status.cacheAgeMs / 1000)}s`
                  : '—'}
              </span>
            </div>
          </div>

          {status?.error && (
            <div className="mt-2 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2">
              <p className="text-[0.75rem] text-red-400 leading-snug">{status.error}</p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* What's happening */}
      {topStories.length > 0 && (
        <SectionCard>
          <SectionHeader title="What's happening" />
          <div>
            {topStories.slice(0, 5).map((story, i) => (
              <div
                key={story.id}
                className="px-4 py-3.5 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[0.75rem] text-[#71767b] mb-1 block">
                      {i === 0 ? 'Top story' : `Story ${i + 1}`}
                    </span>
                    <p className="text-[0.875rem] font-bold text-white leading-[1.3] line-clamp-2 tracking-[-0.01em]">
                      {story.headline}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1">
                        <RiFlashlightFill className="text-[#71767b]" size={10} />
                        <span className="text-[0.75rem] text-[#71767b]">
                          {formatNum(story.velocity)}/hr
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <RiGroupFill className="text-[#71767b]" size={10} />
                        <span className="text-[0.75rem] text-[#71767b]">
                          {story.uniqueAuthors}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[0.6875rem] font-black text-[#2a2a2a] w-6 text-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Signal leaderboard */}
      {topStories.length > 0 && (
        <SectionCard>
          <SectionHeader title="Signal leaders" />
          <div className="px-4 py-3 space-y-3">
            {(() => {
              const top = [...topStories].sort((a, b) => b.totalEngagement - a.totalEngagement)[0];
              return top ? (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <RiBarChartHorizontalFill className="text-[#1d9bf0]" size={12} />
                    <span className="text-[0.6875rem] font-semibold tracking-[0.1em] uppercase text-[#1d9bf0]">
                      Most engaged
                    </span>
                  </div>
                  <p className="text-[0.8125rem] text-white font-semibold leading-[1.3] line-clamp-2">
                    {top.headline}
                  </p>
                  <span className="text-[0.75rem] text-[#71767b]">
                    {formatNum(top.totalEngagement)} total engagement
                  </span>
                </div>
              ) : null;
            })()}

            <div className="border-t border-white/[0.06]" />

            {(() => {
              const top = [...topStories].sort((a, b) => b.velocity - a.velocity)[0];
              return top ? (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <RiFlashlightFill className="text-amber-400" size={12} />
                    <span className="text-[0.6875rem] font-semibold tracking-[0.1em] uppercase text-amber-400">
                      Fastest moving
                    </span>
                  </div>
                  <p className="text-[0.8125rem] text-white font-semibold leading-[1.3] line-clamp-2">
                    {top.headline}
                  </p>
                  <span className="text-[0.75rem] text-[#71767b]">
                    {formatNum(top.velocity)}/hr velocity
                  </span>
                </div>
              ) : null;
            })()}

            <div className="border-t border-white/[0.06]" />

            {(() => {
              const top = [...topStories].sort((a, b) => b.uniqueAuthors - a.uniqueAuthors)[0];
              return top ? (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <RiGroupFill className="text-emerald-400" size={12} />
                    <span className="text-[0.6875rem] font-semibold tracking-[0.1em] uppercase text-emerald-400">
                      Most widespread
                    </span>
                  </div>
                  <p className="text-[0.8125rem] text-white font-semibold leading-[1.3] line-clamp-2">
                    {top.headline}
                  </p>
                  <span className="text-[0.75rem] text-[#71767b]">
                    {top.uniqueAuthors} unique authors
                  </span>
                </div>
              ) : null;
            })()}
          </div>
        </SectionCard>
      )}

      {/* Footer */}
      <div className="px-1 pb-2">
        <p className="text-[0.75rem] text-[#71767b] leading-relaxed">
          Stories clustered from live X conversations using AI. Ranked by engagement, velocity, recency & author diversity.
        </p>
      </div>
    </aside>
  );
}

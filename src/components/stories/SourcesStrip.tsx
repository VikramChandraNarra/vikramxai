import { TweetPreview } from '@/lib/types';
import { timeAgo } from '@/lib/utils';
import { FaXTwitter } from 'react-icons/fa6';
import { RiArrowRightUpLine } from 'react-icons/ri';

function InlineAvatar({ src, username }: { src?: string; username: string }) {
  const initial = username.slice(0, 1).toUpperCase();
  return (
    <div className="h-5 w-5 rounded-full bg-[#2a2a2a] border border-white/[0.08] flex-shrink-0 overflow-hidden flex items-center justify-center">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[0.5625rem] font-bold text-[#71767b]">{initial}</span>
      )}
    </div>
  );
}

interface Props {
  tweets: TweetPreview[];
}

export function SourcesStrip({ tweets }: Props) {
  if (tweets.length === 0) return null;

  return (
    <div className="mt-5 pt-4 border-t border-white/[0.08]">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-2.5">
        <FaXTwitter size={11} className="text-[#71767b]" />
        <span className="text-[0.625rem] font-semibold tracking-[0.14em] uppercase text-[#71767b]">
          From {tweets.length} {tweets.length === 1 ? 'post' : 'posts'} on X
        </span>
      </div>

      {/* Source rows */}
      <div className="space-y-1">
        {tweets.slice(0, 3).map((tweet) => {
          const tweetUrl = `https://x.com/${tweet.authorUsername}/status/${tweet.id}`;
          return (
            <a
              key={tweet.id}
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-lg px-2 py-1.5 -mx-2 hover:bg-white/[0.04] transition-colors"
            >
              <InlineAvatar
                src={tweet.authorProfileImageUrl}
                username={tweet.authorUsername}
              />
              <span className="text-[0.8125rem] font-semibold text-white/70 flex-shrink-0">
                @{tweet.authorUsername}
              </span>
              <span className="text-[0.75rem] text-[#71767b] flex-shrink-0">
                · {timeAgo(tweet.createdAt)}
              </span>
              <span className="text-[0.8125rem] text-[#71767b] truncate group-hover:text-[#e7e9ea] transition-colors">
                {tweet.text}
              </span>
              <RiArrowRightUpLine
                size={11}
                className="text-[#71767b] flex-shrink-0 opacity-0 group-hover:opacity-100 group-hover:text-[#1d9bf0] transition-all"
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}

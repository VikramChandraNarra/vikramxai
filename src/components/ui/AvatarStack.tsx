'use client';

import { useState } from 'react';
import { TweetPreview } from '@/lib/types';

interface Author {
  username: string;
  profileImageUrl?: string;
}

function dedupAuthors(tweets: TweetPreview[]): Author[] {
  const seen = new Set<string>();
  const result: Author[] = [];
  for (const t of tweets) {
    const key = t.authorUsername.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push({
        username: t.authorUsername,
        profileImageUrl: t.authorProfileImageUrl,
      });
    }
  }
  return result;
}

function MiniAvatar({
  src,
  username,
  size,
}: {
  src?: string;
  username: string;
  size: number;
}) {
  const [errored, setErrored] = useState(false);
  const initial = username.slice(0, 1).toUpperCase();

  return (
    <div
      className="rounded-full bg-[#2a2a2a] border-2 border-[#16181c] shrink-0 overflow-hidden flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {src && !errored ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={username}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span
          className="font-bold text-[#71767b] select-none leading-none"
          style={{ fontSize: Math.round(size * 0.38) }}
        >
          {initial}
        </span>
      )}
    </div>
  );
}

interface AvatarStackProps {
  tweets: TweetPreview[];
  totalAuthors: number;
  maxVisible?: number;
  size?: number;
}

export function AvatarStack({
  tweets,
  totalAuthors,
  maxVisible = 3,
  size = 20,
}: AvatarStackProps) {
  const authors = dedupAuthors(tweets);
  const visible = authors.slice(0, maxVisible);
  const overflow = Math.max(0, totalAuthors - visible.length);
  const overlap = Math.round(size * 0.3);

  if (visible.length === 0) return null;

  return (
    <div className="flex items-center">
      <div className="flex items-center" style={{ direction: 'ltr' }}>
        {visible.map((author, i) => (
          <div
            key={author.username}
            style={{ marginLeft: i === 0 ? 0 : -overlap, zIndex: maxVisible - i }}
            className="relative"
          >
            <MiniAvatar
              src={author.profileImageUrl}
              username={author.username}
              size={size}
            />
          </div>
        ))}
      </div>
      {overflow > 0 && (
        <span
          className="text-[#71767b] font-medium ml-1.5 select-none"
          style={{ fontSize: size * 0.55 }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

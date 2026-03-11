'use client';

import { useState, useCallback } from 'react';
import { TweetPreview, TweetMedia } from '@/lib/types';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';

interface MediaGalleryProps {
  tweets: TweetPreview[];
  maxImages?: number;
}

interface RankedMedia {
  url: string;
  type: TweetMedia['type'];
  engagement: number;
}

export function MediaGallery({ tweets, maxImages = 8 }: MediaGalleryProps) {
  const seen = new Set<string>();
  const media: RankedMedia[] = [];

  for (const tweet of [...tweets].sort((a, b) => {
    const engA = a.likeCount + 3 * a.retweetCount + 2 * (a.replyCount ?? 0);
    const engB = b.likeCount + 3 * b.retweetCount + 2 * (b.replyCount ?? 0);
    return engB - engA;
  })) {
    for (const m of tweet.media ?? []) {
      if (m.url && !seen.has(m.url)) {
        seen.add(m.url);
        media.push({
          url: m.url,
          type: m.type,
          engagement: tweet.likeCount + 3 * tweet.retweetCount + 2 * (tweet.replyCount ?? 0),
        });
      }
    }
  }

  if (media.length === 0) return null;

  const visible = media.slice(0, maxImages);

  if (visible.length === 1) {
    return (
      <div className="mt-4 flex justify-center rounded-xl bg-white/[0.03]" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={visible[0].url}
          alt=""
          className="max-w-full max-h-[500px] w-auto h-auto rounded-xl"
        />
      </div>
    );
  }

  return <Slideshow media={visible} />;
}

function Slideshow({ media }: { media: RankedMedia[] }) {
  const [current, setCurrent] = useState(0);

  const count = media.length;

  const goTo = useCallback((idx: number) => {
    const next = ((idx % count) + count) % count;
    setCurrent(next);
  }, [count]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    goTo(current - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    goTo(current + 1);
  };

  const handleDot = (e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    goTo(i);
  };

  return (
    <div
      className="mt-4 relative rounded-xl overflow-hidden group/slide"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Slide track */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {media.map((m, i) => (
          <div key={i} className="w-full shrink-0 flex justify-center bg-white/[0.03]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.url}
              alt=""
              className="max-w-full max-h-[500px] w-auto h-auto"
            />
          </div>
        ))}
      </div>

      {/* Prev / Next arrows — visible on hover */}
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover/slide:opacity-100 transition-opacity duration-200 hover:bg-black/80"
        aria-label="Previous"
      >
        <RiArrowLeftSLine size={20} />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover/slide:opacity-100 transition-opacity duration-200 hover:bg-black/80"
        aria-label="Next"
      >
        <RiArrowRightSLine size={20} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {media.map((_, i) => (
          <button
            key={i}
            onClick={(e) => handleDot(e, i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'w-5 h-1.5 bg-white'
                : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Counter badge */}
      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium text-white/80">
        {current + 1} / {count}
      </div>
    </div>
  );
}

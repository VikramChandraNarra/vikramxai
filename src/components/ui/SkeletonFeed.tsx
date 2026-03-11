function SkeletonBlock({
  w = 'w-full',
  h = 'h-4',
  className = '',
}: {
  w?: string;
  h?: string;
  className?: string;
}) {
  return (
    <div className={`${w} ${h} rounded-md animate-shimmer ${className}`} />
  );
}

function SkeletonAvatar({ size = 'h-5 w-5' }: { size?: string }) {
  return <div className={`${size} rounded-full animate-shimmer shrink-0`} />;
}

function SkeletonHero() {
  return (
    <div className="px-4 sm:px-7 pt-5 sm:pt-7 pb-6 sm:pb-8 border-b border-white/8">
      <div className="flex items-center justify-between mb-4">
        <SkeletonBlock w="w-20" h="h-2.5" />
        <SkeletonBlock w="w-14" h="h-2.5" />
      </div>
      <SkeletonBlock h="h-12" className="mb-3" />
      <SkeletonBlock w="w-11/12" h="h-12" className="mb-3" />
      <SkeletonBlock w="w-4/5" h="h-10" className="mb-6" />
      <SkeletonBlock h="h-4" className="mb-2" />
      <SkeletonBlock w="w-5/6" h="h-4" className="mb-8" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2 py-1.5">
          <SkeletonAvatar />
          <SkeletonBlock w="w-20" h="h-2.5" />
          <SkeletonBlock w="w-12" h="h-2.5" />
          <SkeletonBlock w="w-40" h="h-2.5" />
        </div>
      ))}
      <div className="flex items-center gap-4 mt-6">
        <SkeletonBlock w="w-28" h="h-2.5" />
        <SkeletonBlock w="w-20" h="h-2.5" />
        <SkeletonBlock w="w-20" h="h-2.5" />
      </div>
    </div>
  );
}

function SkeletonStoryCard() {
  return (
    <div className="px-6 py-5 border-b border-white/8 space-y-2">
      <div className="flex items-center justify-between">
        <SkeletonBlock w="w-16" h="h-2" />
        <SkeletonBlock w="w-10" h="h-2" />
      </div>
      <SkeletonBlock h="h-4" />
      <SkeletonBlock w="w-5/6" h="h-4" />
      <SkeletonBlock w="w-full" h="h-3.5" className="mt-0.5" />
      <SkeletonBlock w="w-2/3" h="h-3.5" />
      <div className="flex items-center gap-3 pt-1">
        <SkeletonBlock w="w-16" h="h-2.5" />
        <SkeletonBlock w="w-12" h="h-2.5" />
      </div>
    </div>
  );
}

function SkeletonRight() {
  return (
    <div className="px-4 py-5 space-y-3">
      <SkeletonBlock w="w-24" h="h-2.5" className="mb-3" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-3 py-1.5">
          <SkeletonBlock w="w-4" h="h-4" />
          <div className="flex-1 space-y-1.5">
            <SkeletonBlock h="h-3.5" />
            <SkeletonBlock w="w-3/4" h="h-3.5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonFeed() {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] items-start">
      {/* Main content */}
      <div>
        <SkeletonHero />

        {/* Section header skeleton */}
        <div className="flex items-center gap-2.5 px-4 sm:px-6 py-4 border-b border-white/8">
          <SkeletonBlock w="w-24" h="h-2.5" />
          <SkeletonBlock w="w-10" h="h-2" />
        </div>

        {/* Story grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={i % 2 === 0 ? 'sm:border-r border-white/8' : ''}>
              <SkeletonStoryCard />
            </div>
          ))}
        </div>
      </div>

      {/* Right sidebar — hidden on mobile/tablet */}
      <div className="hidden lg:block border-l border-white/8">
        <SkeletonRight />
      </div>
    </div>
  );
}

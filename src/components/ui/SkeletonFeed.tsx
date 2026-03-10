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

function SkeletonAvatar() {
  return <div className="h-7 w-7 rounded-full animate-shimmer flex-shrink-0" />;
}

export function SkeletonFeed() {
  return (
    <div aria-hidden="true">
      {/* Hero skeleton */}
      <div className="px-6 pt-8 pb-7 border-b border-white/[0.08]">
        <div className="flex items-center justify-between mb-5">
          <SkeletonBlock w="w-20" h="h-2.5" />
          <SkeletonBlock w="w-12" h="h-2.5" />
        </div>
        <SkeletonBlock h="h-9" className="mb-2" />
        <SkeletonBlock w="w-4/5" h="h-9" className="mb-5" />
        <SkeletonBlock h="h-4" className="mb-1.5" />
        <SkeletonBlock w="w-3/4" h="h-4" className="mb-7" />

        {/* Tweet snippet skeletons */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="p-3 rounded-xl border border-white/[0.06] mb-2.5 space-y-2"
          >
            <div className="flex items-center gap-2">
              <SkeletonAvatar />
              <SkeletonBlock w="w-28" h="h-3" />
            </div>
            <SkeletonBlock h="h-3" />
            <SkeletonBlock w="w-2/3" h="h-3" />
          </div>
        ))}

        <div className="flex items-center gap-5 mt-5">
          <SkeletonBlock w="w-28" h="h-3" />
          <SkeletonBlock w="w-20" h="h-3" />
          <SkeletonBlock w="w-20" h="h-3" />
        </div>
      </div>

      {/* Story card skeletons */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="px-6 py-5 border-b border-white/[0.08] space-y-2.5">
          <div className="flex items-center justify-between">
            <SkeletonBlock w="w-16" h="h-2.5" />
            <SkeletonBlock w="w-10" h="h-2.5" />
          </div>
          <SkeletonBlock h="h-5" />
          <SkeletonBlock w="w-5/6" h="h-4" />
          <div className="flex items-center gap-2 pt-1">
            <SkeletonAvatar />
            <SkeletonBlock w="w-48" h="h-3" />
          </div>
          <div className="flex items-center gap-4 pt-0.5">
            <SkeletonBlock w="w-16" h="h-2.5" />
            <SkeletonBlock w="w-10" h="h-2.5" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface Props {
  isRunning?: boolean;
  className?: string;
}

export function LiveIndicator({ className = '' }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      <span className="text-[0.6875rem] font-semibold tracking-[0.1em] uppercase text-emerald-400">
        Live
      </span>
    </span>
  );
}

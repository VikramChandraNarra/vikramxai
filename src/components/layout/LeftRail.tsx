'use client';

import Image from 'next/image';
import {
  RiHome2Line,
  RiHome2Fill,
  RiFlashlightLine,
  RiFlashlightFill,
  RiBarChartLine,
  RiBarChartFill,
} from 'react-icons/ri';

const navItems = [
  { icon: RiHome2Line, activeIcon: RiHome2Fill, label: 'Stories', active: true },
  { icon: RiFlashlightLine, activeIcon: RiFlashlightFill, label: 'Breaking', active: false },
  { icon: RiBarChartLine, activeIcon: RiBarChartFill, label: 'Trending', active: false },
];

interface Props {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function LeftRail({ onRefresh, isRefreshing }: Props) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[275px] flex flex-col border-r border-white/[0.08] px-4 py-3 z-20">
      {/* Logo lockup */}
      <button
        onClick={scrollToTop}
        className="flex items-center gap-3 px-3 py-4 mb-2 rounded-full hover:bg-white/[0.07] transition-all duration-150 group cursor-pointer"
      >
        <div className="flex h-[30px] w-[30px] items-center justify-center flex-shrink-0 rounded-full overflow-hidden group-hover:opacity-85 transition-opacity">
          <Image
            src="/new-2023-twitter-logo-x-icon-design_1017-45418.avif"
            alt="X"
            width={30}
            height={30}
            className="object-contain drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]"
            priority
          />
        </div>
        <div className="leading-none text-left">
          <div className="text-[0.9375rem] font-extrabold text-white tracking-[-0.01em]">
            AI Stories
          </div>
          <div className="text-[0.75rem] text-[#71767b] mt-0.5">Powered by xAI</div>
        </div>
      </button>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ icon: Icon, activeIcon: ActiveIcon, label, active }) => {
          const IconComponent = active ? ActiveIcon : Icon;
          return (
            <button
              key={label}
              className={`flex items-center gap-4 rounded-full px-4 py-3 text-left transition-colors hover:bg-white/[0.07] group ${
                active ? 'font-bold' : 'font-normal'
              }`}
            >
              <IconComponent
                size={23}
                className={active ? 'text-white' : 'text-[#e7e9ea] group-hover:text-white transition-colors'}
              />
              <span
                className={`text-[1.0625rem] leading-none ${
                  active ? 'text-white font-bold' : 'text-[#e7e9ea] group-hover:text-white transition-colors'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Refresh CTA */}
      <div className="mt-5 px-2">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`w-full rounded-full bg-[#1d9bf0] py-3.5 text-[0.9375rem] font-bold text-white transition-all duration-150 hover:bg-[#1a8cd8] active:scale-[0.98] ${
            isRefreshing ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isRefreshing ? 'Refreshing…' : 'Refresh Stories'}
        </button>
      </div>

      <div className="flex-1" />

      {/* Footer — neutral for logged-out experience */}
      <div className="border-t border-white/[0.08] px-2 pt-4 pb-2">
        <p className="text-[0.75rem] text-[#71767b] leading-relaxed">
          Powered by xAI. Stories from live X conversations.
        </p>
      </div>
    </aside>
  );
}

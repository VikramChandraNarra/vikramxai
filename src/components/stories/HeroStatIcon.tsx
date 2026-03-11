'use client';

import {
  RiFlashlightFill,
  RiBarChartHorizontalFill,
  RiEyeLine,
  RiGroupLine,
  RiChat1Line,
} from 'react-icons/ri';
import type { HeroStat } from '@/lib/utils';

const ICON_MAP = {
  lightning: RiFlashlightFill,
  chart: RiBarChartHorizontalFill,
  eye: RiEyeLine,
  users: RiGroupLine,
  messages: RiChat1Line,
} as const;

interface Props {
  icon: HeroStat['icon'];
  size?: number;
  className?: string;
}

export function HeroStatIcon({ icon, size = 12, className = 'text-[#71767b]' }: Props) {
  const Icon = ICON_MAP[icon];
  return <Icon size={size} className={className} />;
}

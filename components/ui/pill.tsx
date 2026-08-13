// components/ui/pill.tsx
//
// Small status badge / tag. Two ways to colour it:
//
//   1. `tone="dark" | "default" | "red" | "green"` — pre-canned variants for
//      90% of cases. Use these by default — they keep colour decisions in
//      one place.
//
//   2. `textClass` + `bgClass` — escape hatch when a caller needs an
//      ad-hoc colour pair (see ChannelCard's "% rec" pill). These override
//      whatever `tone` would have set.

import { cn } from '@/lib/utils/cn';
import type { ReactNode } from 'react';

export type PillTone = 'default' | 'dark' | 'red' | 'green';

interface PillProps {
  children: ReactNode;
  tone?: PillTone;
  /** Tailwind text colour, e.g. "text-green". Overrides `tone`. */
  textClass?: string;
  /** Tailwind bg colour, e.g. "bg-green-soft". Overrides `tone`. */
  bgClass?: string;
  className?: string;
  icon?: ReactNode;
}

const toneMap: Record<PillTone, { text: string; bg: string }> = {
  default: { text: 'text-body',  bg: 'bg-surface-alt' },
  dark:    { text: 'text-white', bg: 'bg-black/65 backdrop-blur-sm' },
  red:     { text: 'text-white', bg: 'bg-red' },
  green:   { text: 'text-green', bg: 'bg-green-soft' },
};

export function Pill({
  children,
  tone = 'default',
  textClass,
  bgClass,
  icon,
  className,
}: PillProps) {
  const variant = toneMap[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
        bgClass ?? variant.bg,
        textClass ?? variant.text,
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

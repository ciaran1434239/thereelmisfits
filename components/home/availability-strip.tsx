// components/home/availability-strip.tsx
//
// Top-level "where can I watch?" filters. Distinct from the genre chip strip
// below it — this is a question of *availability*, not *taste*. They sit in
// the same horizontal slot but answer different things, so they're styled
// differently: availability gets icons + larger pills, genre stays as small
// text chips.
//
// V0.2: visual only, no real filtering yet. The buttons set local state so
// you can see the active style, but they don't filter the rows below.
// To wire real filtering, lift the active state to URL params and have
// each row read availability from its query.

'use client';

import { useState } from 'react';
import { Clapperboard, Tv, Calendar, Play } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type AvailabilityKey = 'all' | 'cinemas' | 'streaming' | 'tv' | 'coming-soon';

const options: Array<{
  key: AvailabilityKey;
  label: string;
  icon: typeof Clapperboard;
}> = [
  { key: 'all',         label: 'All',          icon: Play },
  { key: 'cinemas',     label: 'In cinemas',   icon: Clapperboard },
  { key: 'streaming',   label: 'Streaming',    icon: Play },
  { key: 'tv',          label: 'TV',           icon: Tv },
  { key: 'coming-soon', label: 'Coming soon',  icon: Calendar },
];

export function AvailabilityStrip() {
  const [active, setActive] = useState<AvailabilityKey>('all');

  return (
    <div
      role="tablist"
      aria-label="Where to watch"
      className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1 scrollbar-hide"
    >
      {options.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setActive(key)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              isActive
                ? 'bg-ink text-white'
                : 'bg-surface-alt text-body hover:bg-surface-hover'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

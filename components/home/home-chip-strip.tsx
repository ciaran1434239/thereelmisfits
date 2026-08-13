// components/home/home-chip-strip.tsx
'use client';

import { useState } from 'react';
import { Chip } from '@/components/ui/chip';

const chips = [
  'All', 'New releases', 'Trending', 'Drama', 'Horror',
  'TV', 'Comedy', 'Documentary', 'Festival', 'Awards bait', 'Box office',
];

export function HomeChipStrip() {
  const [active, setActive] = useState('All');
  return (
    <div
      role="tablist"
      aria-label="Filter content"
      className="flex gap-2.5 pb-4 border-b border-border mb-6 overflow-x-auto"
    >
      {chips.map((c) => (
        <Chip key={c} active={active === c} onClick={() => setActive(c)}>
          {c}
        </Chip>
      ))}
    </div>
  );
}

// components/channel/channel-tabs.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

const tabs = [
  { key: 'videos', label: 'Videos' },
  { key: 'recommends', label: 'Recommends' },
  { key: 'passes', label: 'Skip it' },
  { key: 'about', label: 'About' },
] as const;

type TabKey = typeof tabs[number]['key'];

interface ChannelTabsProps {
  /** Children render based on the selected tab. */
  children: (tab: TabKey) => React.ReactNode;
}

export function ChannelTabs({ children }: ChannelTabsProps) {
  const [tab, setTab] = useState<TabKey>('videos');
  return (
    <>
      <div
        role="tablist"
        aria-label="Channel sections"
        className="mx-4 sm:mx-6 flex gap-6 border-b border-border"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'py-3.5 text-sm font-semibold border-b-[3px] -mb-px transition-colors',
              tab === t.key
                ? 'text-ink border-ink'
                : 'text-subtle border-transparent hover:text-body'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="px-4 sm:px-6 py-5">{children(tab)}</div>
    </>
  );
}

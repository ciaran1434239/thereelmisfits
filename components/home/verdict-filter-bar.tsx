'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

const FILTERS = [
  { label: 'All',       value: 'all'       },
  { label: 'Recommend', value: 'recommend' },
  { label: 'Skip It',   value: 'skip'      },
] as const;

type FilterValue = typeof FILTERS[number]['value'];

interface VerdictFilterBarProps {
  currentFilter: string;
}

export function VerdictFilterBar({ currentFilter }: VerdictFilterBarProps) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams= useSearchParams();

  const setFilter = useCallback((value: FilterValue) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete('filter');
    else params.set('filter', value);
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}` as any, { scroll: false });
  }, [router, pathname, searchParams]);

  return (
    <div
      className="sticky top-0 z-30 w-full"
      style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--bg-panel-edge)' }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 py-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map(f => {
            const active = (f.value === 'all' ? (!currentFilter || currentFilter === 'all') : currentFilter === f.value);
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className="flex-none text-[11px] font-black uppercase tracking-[0.12em] px-3 py-1.5 transition-all duration-100"
                style={active ? {
                  background: 'var(--brand)',
                  color: '#fff',
                  border: '1px solid var(--brand)',
                } : {
                  background: 'transparent',
                  color: 'var(--ink-muted)',
                  border: '1px solid var(--bg-panel-edge)',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

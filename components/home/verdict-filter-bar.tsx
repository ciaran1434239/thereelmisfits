'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

const FILTERS = [
  { label: 'All',       value: 'all'       },
  { label: 'Recommend', value: 'recommend' },
  { label: 'Skip It',   value: 'skip'      },
] as const;

export function VerdictFilterBar({ currentFilter }: { currentFilter: string }) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const setFilter = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete('filter');
    else params.set('filter', value);
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}` as any, { scroll: false });
  }, [router, pathname, searchParams]);

  return (
    <div className="flex items-center gap-5" role="tablist">
      {FILTERS.map(f => {
        const active = f.value === 'all' ? (!currentFilter || currentFilter === 'all') : currentFilter === f.value;
        return (
          <button
            key={f.value}
            role="tab"
            aria-selected={active}
            onClick={() => setFilter(f.value)}
            className="text-[13px] font-bold pb-1 transition-colors"
            style={{
              color: active ? '#151515' : '#5F5A50',
              borderBottom: active ? '2px solid #C8201F' : '2px solid transparent',
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

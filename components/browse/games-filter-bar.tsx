'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { ChevronDown } from 'lucide-react';

interface GamesFilterBarProps {
  activePlatform: string;
  activeGenre:    string;
  activeSort:     'score' | 'recent' | 'alpha' | 'count';
}

const PLATFORMS = [
  { label: 'PC',     value: 'PC'     },
  { label: 'PS5',    value: 'PS5'    },
  { label: 'PS4',    value: 'PS4'    },
  { label: 'Xbox',   value: 'Xbox'   },
  { label: 'Switch', value: 'Switch' },
];

const GENRES = [
  { label: 'RPG',        value: 'RPG'       },
  { label: 'Shooter',    value: 'Shooter'   },
  { label: 'Adventure',  value: 'Adventure' },
  { label: 'Strategy',   value: 'Strategy'  },
  { label: 'Fighting',   value: 'Fighting'  },
  { label: 'Platformer', value: 'Platform'  },
  { label: 'Racing',     value: 'Racing'    },
  { label: 'Sports',     value: 'Sports'    },
  { label: 'Indie',      value: 'Indie'     },
];

function FilterBarContent({ activePlatform, activeGenre, activeSort }: GamesFilterBarProps) {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const router       = useRouter();

  const getPath = (key: string, value: string) => {
    const p = new URLSearchParams(Array.from(searchParams.entries()));
    if (value === 'all' || value === 'recent') p.delete(key); else p.set(key, value);
    const q = p.toString();
    return `${pathname}${q ? `?${q}` : ''}`;
  };

  const handleSelect = (key: string) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    router.push(getPath(key, e.target.value) as any, { scroll: false });

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-2">

      {/* LEFT: Sort */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <FilterGroup label="Sort">
          <TextLink path={getPath('sort', 'recent')} active={activeSort === 'recent'}>Most Recent</TextLink>
          <TextLink path={getPath('sort', 'score')}  active={activeSort === 'score'}>Top Scoring</TextLink>
          <TextLink path={getPath('sort', 'count')}  active={activeSort === 'count'}>Most Reviewed</TextLink>
          <TextLink path={getPath('sort', 'alpha')}  active={activeSort === 'alpha'}>A–Z</TextLink>
        </FilterGroup>
      </div>

      {/* RIGHT: Platform + Genre dropdowns */}
      <div className="flex items-center gap-4 flex-wrap">
        <DropdownFilter label="Platform" value={activePlatform} onChange={handleSelect('platform')}>
          <option value="all">All Platforms</option>
          {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </DropdownFilter>

        <DropdownFilter label="Genre" value={activeGenre} onChange={handleSelect('genre')}>
          <option value="all">All Genres</option>
          {GENRES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
        </DropdownFilter>
      </div>
    </div>
  );
}

export function GamesFilterBar(props: GamesFilterBarProps) {
  return (
    <Suspense fallback={<div className="h-10 w-full animate-pulse bg-[#1E1E1E] rounded-full" />}>
      <FilterBarContent {...props} />
    </Suspense>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-[10px] font-black uppercase tracking-widest text-[#777777]">{label}</span>
      <div className="flex items-center gap-4">{children}</div>
    </div>
  );
}

function DropdownFilter({ label, value, onChange, children }: {
  label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-black uppercase tracking-widest text-[#777777]">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="appearance-none bg-[#181818] border-2 border-[#333333] rounded-full py-1.5 pl-4 pr-10 text-xs font-bold uppercase tracking-wider text-white outline-none focus:border-[#E21D1D]/40 focus:ring-4 focus:ring-[#E21D1D]/10 transition-all cursor-pointer hover:border-[#444444]"
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] pointer-events-none" size={14} />
      </div>
    </div>
  );
}

function TextLink({ path, active, children }: { path: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={path as any} scroll={false} className={cn(
      'text-xs font-bold uppercase tracking-wider transition-all',
      active ? 'text-white underline decoration-2 decoration-[#E21D1D] underline-offset-[6px]' : 'text-[#999999] hover:text-white'
    )}>
      {children}
    </Link>
  );
}

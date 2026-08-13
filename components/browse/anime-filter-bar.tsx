'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { ChevronDown } from 'lucide-react';

interface AnimeFilterBarProps {
  activeType: 'all' | 'tv' | 'movie';
  activeGenre: string;
  activeSort: 'score' | 'recent' | 'alpha' | 'count';
}

// Anime genres as returned by TMDB for JP Animation titles.
// Note: Shonen/Seinen/Isekai are community tags, not TMDB genres —
// those require AniList integration (future work).
const ANIME_GENRES = [
  { label: 'Action & Adventure', value: 'Action & Adventure' },
  { label: 'Comedy',             value: 'Comedy' },
  { label: 'Drama',              value: 'Drama' },
  { label: 'Sci-Fi & Fantasy',   value: 'Sci-Fi & Fantasy' },
  { label: 'Mystery',            value: 'Mystery' },
  { label: 'Romance',            value: 'Romance' },
  { label: 'Horror',             value: 'Horror' },
];

function FilterBarContent({ activeType, activeGenre, activeSort }: AnimeFilterBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const getUpdatePath = (key: string, value: string): string => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (value === 'all' || value === 'recent') {
      current.delete(key);
    } else {
      current.set(key, value);
    }
    const search = current.toString();
    return `${pathname}${search ? `?${search}` : ''}`;
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(getUpdatePath('genre', e.target.value) as any, { scroll: false });
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-2">

      {/* LEFT: Format + Sort */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <FilterGroup label="Format">
          <TextLink path={getUpdatePath('type', 'all')}   active={activeType === 'all'}>All</TextLink>
          <TextLink path={getUpdatePath('type', 'tv')}    active={activeType === 'tv'}>Series</TextLink>
          <TextLink path={getUpdatePath('type', 'movie')} active={activeType === 'movie'}>Films</TextLink>
        </FilterGroup>

        <div className="hidden md:block w-px h-4 bg-[#333333]" />

        <FilterGroup label="Sort">
          <TextLink path={getUpdatePath('sort', 'recent')} active={activeSort === 'recent'}>Most Recent</TextLink>
          <TextLink path={getUpdatePath('sort', 'score')}  active={activeSort === 'score'}>Top Scoring</TextLink>
          <TextLink path={getUpdatePath('sort', 'count')}  active={activeSort === 'count'}>Most Reviewed</TextLink>
          <TextLink path={getUpdatePath('sort', 'alpha')}  active={activeSort === 'alpha'}>A–Z</TextLink>
        </FilterGroup>
      </div>

      {/* RIGHT: Genre dropdown */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#777777]">Genre</span>
        <div className="relative">
          <select
            value={activeGenre}
            onChange={handleGenreChange}
            className="appearance-none bg-[#181818] border-2 border-[#333333] rounded-full py-1.5 pl-4 pr-10 text-xs font-bold uppercase tracking-wider text-white outline-none focus:border-[#E21D1D]/40 focus:ring-4 focus:ring-[#E21D1D]/10 transition-all cursor-pointer hover:border-[#444444]"
          >
            <option value="all">All Genres</option>
            {ANIME_GENRES.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] pointer-events-none" size={14} />
        </div>
      </div>
    </div>
  );
}

export function AnimeFilterBar(props: AnimeFilterBarProps) {
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

function TextLink({ path, active, children }: { path: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={path as any}
      scroll={false}
      className={cn(
        'text-xs font-bold uppercase tracking-wider transition-all',
        active
          ? 'text-white underline decoration-2 decoration-[#E21D1D] underline-offset-[6px]'
          : 'text-[#999999] hover:text-white'
      )}
    >
      {children}
    </Link>
  );
}

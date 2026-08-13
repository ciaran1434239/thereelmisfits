export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { GamesFilterBar } from '@/components/browse/games-filter-bar';
import { supabase } from '@/lib/supabase';
import { coverUrl, getGameById, IGDB_PLATFORMS } from '@/lib/igdb';
import { badgeClasses } from '@/lib/utils/score-tier';

export const metadata: Metadata = {
  title: 'Game Reviews · The Reel Misfits',
  description: 'Video games reviewed by YouTube critics — ranked, scored, and brutally honest.',
};

type SortKey = 'score' | 'recent' | 'alpha' | 'count';
const isSortKey = (s?: string): s is SortKey => !!s && ['score','recent','alpha','count'].includes(s);

interface PageProps {
  searchParams: Promise<{ platform?: string; genre?: string; sort?: string; search?: string }>;
}

export default async function GamesPage({ searchParams }: PageProps) {
  const params       = await searchParams;
  const sortKey      = isSortKey(params.sort) ? params.sort : 'recent';
  const platformFilter = params.platform ?? 'all';
  const genreFilter  = params.genre    ?? 'all';
  const searchQuery  = params.search?.trim().toLowerCase() ?? '';

  // ── Pull reviewed games from DB ───────────────────────────────────────────
  const { data: games } = await supabase
    .from('games')
    .select('id, title, cover_image_id, reviews(recommend, score, posted_at)');

  const gamesWithReviews = (games ?? []).filter(
    g => Array.isArray(g.reviews) && g.reviews.length > 0
  );

  // ── Enrich with IGDB ──────────────────────────────────────────────────────
  const enriched = await Promise.all(
    gamesWithReviews.map(async (game) => {
      const igdb = await getGameById(game.id).catch(() => null);

      const reviews   = game.reviews as { recommend: boolean | null; score: number; posted_at: string }[];
      const MIN       = 4;
      const scored    = reviews.filter(r => r.recommend !== null);
      const recCount  = scored.filter(r => r.recommend === true).length;
      const passCount = scored.filter(r => r.recommend === false).length;
      const recPct    = scored.length >= MIN ? Math.round((recCount / scored.length) * 100) : null;
      const latestDate = reviews.reduce((l, r) => r.posted_at > l ? r.posted_at : l, reviews[0]?.posted_at ?? '');

      const genres: string[]    = igdb?.genres?.map((g: any) => g.name) ?? [];
      const platforms: string[] = igdb?.platforms?.map((p: any) => p.name) ?? [];
      const platformIds: number[] = igdb?.platforms?.map((p: any) => p.id) ?? [];
      const year = igdb?.first_release_date
        ? new Date(igdb.first_release_date * 1000).getFullYear()
        : 0;

      return {
        id: game.id,
        title: game.title,
        coverImageId: game.cover_image_id ?? igdb?.cover?.image_id ?? null,
        recPct,
        recCount,
        passCount,
        total: reviews.length,
        latestDate,
        genres,
        platforms,
        platformIds,
        year,
        dev: igdb?.dev ?? null,
      };
    })
  );

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = enriched.filter(g => {
    if (searchQuery && !g.title.toLowerCase().includes(searchQuery)) return false;
    if (platformFilter !== 'all') {
      const ids = IGDB_PLATFORMS[platformFilter] ?? [];
      if (!g.platformIds.some(id => ids.includes(id))) return false;
    }
    if (genreFilter !== 'all' && !g.genres.includes(genreFilter)) return false;
    return true;
  });

  // ── Sort ──────────────────────────────────────────────────────────────────
  filtered.sort((a, b) => {
    if (sortKey === 'alpha')  return a.title.localeCompare(b.title);
    if (sortKey === 'recent') return b.latestDate.localeCompare(a.latestDate);
    if (sortKey === 'count')  return b.total - a.total;
    const ap = a.recPct ?? -1, bp = b.recPct ?? -1;
    return ap !== bp ? bp - ap : b.total - a.total;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-[1140px] w-full mx-auto px-4 sm:px-6 flex-1 flex flex-col">

        {/* ── Header — identical structure to /reviews ── */}
        <header className="pt-8 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-2 w-2 rounded-full bg-white/20 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#777777]">
              The Games Database
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#333333] pb-4">
            <h1 className="text-4xl sm:text-6xl font-[950] uppercase tracking-[-0.02em] text-white leading-none">
              {searchQuery
                ? <><span className="text-[#E21D1D]">&quot;{params.search}&quot;</span></>
                : <>THE <span className="text-[#E21D1D]">GAMES</span></>
              }
            </h1>
            <div className="flex flex-col items-start sm:items-end">
              <p className="text-[11px] font-bold text-[#999999] uppercase tracking-widest">
                {searchQuery ? 'Search results' : 'Video games reviewed by YouTube critics'}
              </p>
              <p className="text-[10px] font-black text-[#E21D1D] uppercase tracking-widest mt-1">
                {filtered.length} {searchQuery ? 'results' : 'Games Reviewed'}
              </p>
            </div>
          </div>
        </header>

        {/* ── Filter bar ── */}
        <div className="mb-8 border-b border-[#333333] pb-8">
          <GamesFilterBar
            activePlatform={platformFilter}
            activeGenre={genreFilter}
            activeSort={sortKey}
          />
        </div>

        {/* ── Grid — same 2:3 poster grid as movies ── */}
        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <p className="text-sm font-bold text-[#777777] uppercase tracking-widest">
              {enriched.length === 0
                ? 'No game reviews yet — add gaming creators in Admin to get started'
                : 'No games match those filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10 pb-20">
            {filtered.map(game => (
              <Link key={game.id} href={`/game/${game.id}`} className="group block">
                {/* 2:3 poster — same aspect ratio as movie posters */}
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#1E1E1E] shadow-sm group-hover:shadow-lg transition-shadow mb-3">
                  {game.coverImageId ? (
                    <img
                      src={coverUrl(game.coverImageId)}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <span className="text-[11px] font-black uppercase text-[#555] text-center leading-tight">{game.title}</span>
                    </div>
                  )}
                  {/* Score pill — top right, same as movie cards */}
                  {game.recPct !== null && (
                    <div className={`absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-md ${badgeClasses(game.recPct)}`}>
                      {game.recPct}%
                    </div>
                  )}
                </div>
                <p className="text-[13px] font-black uppercase tracking-tight text-white/80 group-hover:text-white transition-colors line-clamp-2 leading-tight">
                  {game.title}
                </p>
                <p className="text-[11px] text-[#666666] font-semibold mt-1">
                  {game.year > 0 ? `${game.year} · ` : ''}{game.total} {game.total === 1 ? 'review' : 'reviews'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

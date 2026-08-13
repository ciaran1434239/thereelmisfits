export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { AnimeFilterBar } from '@/components/browse/anime-filter-bar';
import { TitleCard } from '@/components/domain/title-card';
import { supabase } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Anime Reviews · The Reel Misfits',
  description: 'Japanese anime reviewed by YouTube critics — ranked, scored, and brutally honest.',
};

type SortKey = 'score' | 'recent' | 'alpha' | 'count';
type TypeKey = 'all' | 'tv' | 'movie';
const isSortKey = (s: string | undefined): s is SortKey =>
  !!s && ['score', 'recent', 'alpha', 'count'].includes(s);
const isTypeKey = (s: string | undefined): s is TypeKey =>
  !!s && ['all', 'tv', 'movie'].includes(s);

const DEFAULT_PALETTE: [string, string, string] = ['#1a1a2e', '#16213e', '#0f3460'];

interface PageProps {
  searchParams: Promise<{ genre?: string; sort?: string; type?: string; search?: string }>;
}

// Detect Japanese anime: genre 16 (Animation) + JP origin or Japanese language
function isJpAnime(tmdb: any): boolean {
  if (!tmdb) return false;
  const hasAnimationGenre = tmdb.genres?.some((g: any) => g.id === 16);
  if (!hasAnimationGenre) return false;
  return (
    tmdb.origin_country?.includes('JP') ||
    tmdb.original_language === 'ja'
  );
}

export default async function AnimePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const genreFilter  = params.genre ?? 'all';
  const sortKey: SortKey  = isSortKey(params.sort)  ? params.sort  : 'recent';
  const typeFilter: TypeKey = isTypeKey(params.type) ? params.type : 'all';
  const searchQuery  = params.search?.trim().toLowerCase() ?? '';
  const apiKey = process.env.TMDB_API_KEY;

  // ── Pull every reviewed show + movie from DB ────────────────────────────────
  const [{ data: shows }, { data: movies }] = await Promise.all([
    supabase.from('shows').select('id, title, backdrop_path, reviews(recommend, score, posted_at)').order('title'),
    supabase.from('movies').select('id, title, backdrop_path, reviews(recommend, score, posted_at)').order('title'),
  ]);

  const showsWithReviews  = (shows  ?? []).filter(s => Array.isArray(s.reviews) && s.reviews.length > 0);
  const moviesWithReviews = (movies ?? []).filter(m => Array.isArray(m.reviews) && m.reviews.length > 0);

  // ── Enrich with TMDB, filter to JP anime ───────────────────────────────────
  const enriched = (await Promise.all([

    ...showsWithReviews.map(async (show) => {
      const tmdb = await fetch(
        `https://api.themoviedb.org/3/tv/${show.id}?api_key=${apiKey}`,
        { next: { revalidate: 86400 } }
      ).then(r => r.ok ? r.json() : null).catch(() => null);

      if (!isJpAnime(tmdb)) return null;

      const reviews = show.reviews as { recommend: boolean | null; score: number; posted_at: string }[];
      const MIN_REVIEWS = 4;
      const scored   = reviews.filter(r => r.recommend !== null);
      const recCount = scored.filter(r => r.recommend === true).length;
      const passCount = scored.filter(r => r.recommend === false).length;
      const recPct   = scored.length >= MIN_REVIEWS ? Math.round((recCount / scored.length) * 100) : null;
      const avgScore = reviews.reduce((s, r) => s + (r.score ?? 0), 0) / reviews.length;
      const latestDate = reviews.reduce((l, r) => r.posted_at > l ? r.posted_at : l, reviews[0]?.posted_at ?? '');
      const genres: string[] = (tmdb?.genres ?? []).filter((g: any) => g.id !== 16).map((g: any) => g.name);
      const year = tmdb?.first_air_date ? parseInt(tmdb.first_air_date.substring(0, 4)) : 0;

      return {
        title: {
          id: String(show.id),
          title: show.title || 'Unknown',
          year,
          director: tmdb?.production_companies?.[0]?.name ?? '',
          genre: genres,
          poster: DEFAULT_PALETTE,
          posterUrl: tmdb?.poster_path ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}` : undefined,
          type: 'tv' as const,
          synopsis: tmdb?.overview ?? '',
          slug: '',
          featured: false,
        },
        consensus: { score: Math.round(avgScore * 10), recPct, recCount, passCount, total: reviews.length },
        latestDate,
        genres,
      };
    }),

    ...moviesWithReviews.map(async (movie) => {
      const tmdb = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}`,
        { next: { revalidate: 86400 } }
      ).then(r => r.ok ? r.json() : null).catch(() => null);

      if (!isJpAnime(tmdb)) return null;

      const reviews = movie.reviews as { recommend: boolean | null; score: number; posted_at: string }[];
      const MIN_REVIEWS = 4;
      const scored   = reviews.filter(r => r.recommend !== null);
      const recCount = scored.filter(r => r.recommend === true).length;
      const passCount = scored.filter(r => r.recommend === false).length;
      const recPct   = scored.length >= MIN_REVIEWS ? Math.round((recCount / scored.length) * 100) : null;
      const avgScore = reviews.reduce((s, r) => s + (r.score ?? 0), 0) / reviews.length;
      const latestDate = reviews.reduce((l, r) => r.posted_at > l ? r.posted_at : l, reviews[0]?.posted_at ?? '');
      const genres: string[] = (tmdb?.genres ?? []).filter((g: any) => g.id !== 16).map((g: any) => g.name);
      const year = tmdb?.release_date ? parseInt(tmdb.release_date.substring(0, 4)) : 0;

      return {
        title: {
          id: String(movie.id),
          title: movie.title || 'Unknown',
          year,
          director: tmdb?.production_companies?.[0]?.name ?? '',
          genre: genres,
          poster: DEFAULT_PALETTE,
          posterUrl: tmdb?.poster_path ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}` : undefined,
          type: 'movie' as const,
          synopsis: tmdb?.overview ?? '',
          slug: '',
          featured: false,
        },
        consensus: { score: Math.round(avgScore * 10), recPct, recCount, passCount, total: reviews.length },
        latestDate,
        genres,
      };
    }),

  ])).filter((e): e is NonNullable<typeof e> => e !== null);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = enriched.filter(e => {
    if (typeFilter !== 'all' && e.title.type !== typeFilter) return false;
    if (genreFilter !== 'all' && !e.genres.includes(genreFilter)) return false;
    if (searchQuery && !e.title.title.toLowerCase().includes(searchQuery)) return false;
    return true;
  });

  // ── Sort ───────────────────────────────────────────────────────────────────
  filtered.sort((a, b) => {
    if (sortKey === 'alpha')  return a.title.title.localeCompare(b.title.title);
    if (sortKey === 'recent') return b.latestDate.localeCompare(a.latestDate);
    if (sortKey === 'count')  return b.consensus.total - a.consensus.total;
    const aPct = a.consensus.recPct ?? -1;
    const bPct = b.consensus.recPct ?? -1;
    if (aPct !== bPct) return bPct - aPct;
    return b.consensus.total - a.consensus.total;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-[1140px] w-full mx-auto px-4 sm:px-6 flex-1 flex flex-col">

        <header className="pt-8 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-2 w-2 rounded-full bg-white/20 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#777777]">
              The Anime Database
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#333333] pb-4">
            <h1 className="text-4xl sm:text-6xl font-[950] uppercase tracking-[-0.02em] text-white leading-none">
              {searchQuery
                ? <><span className="text-[#E21D1D]">&quot;{params.search}&quot;</span></>
                : <>THE <span className="text-[#E21D1D]">ANIME</span></>
              }
            </h1>
            <div className="flex flex-col items-start sm:items-end">
              <p className="text-[11px] font-bold text-[#999999] uppercase tracking-widest">
                {searchQuery ? 'Search results' : 'Japanese anime reviewed by YouTube critics'}
              </p>
              <p className="text-[10px] font-black text-[#E21D1D] uppercase tracking-widest mt-1">
                {filtered.length} {searchQuery ? 'results' : 'Titles Analyzed'}
              </p>
            </div>
          </div>
        </header>

        {/* ── Filter bar ── */}
        <div className="mb-8 border-b border-[#333333] pb-8">
          <AnimeFilterBar
            activeType={typeFilter}
            activeGenre={genreFilter}
            activeSort={sortKey}
          />
        </div>

        {/* ── Grid — identical to reviews page ── */}
        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <p className="text-sm font-bold text-[#777777] uppercase tracking-widest">
              {enriched.length === 0
                ? 'No anime reviews yet — add anime creators in Admin to get started'
                : 'No titles match those filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10 pb-20">
            {filtered.map(({ title, consensus }) => (
              <TitleCard
                key={`${title.type}-${title.id}`}
                title={{ ...title as any, href: title.type === 'tv' ? `/show/${title.id}` : `/movie/${title.id}` }}
                consensus={consensus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

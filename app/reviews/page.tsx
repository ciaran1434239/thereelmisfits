export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { BrowseFilterBar } from '@/components/browse/browse-filter-bar';
import { TitleCard } from '@/components/domain/title-card';
import { supabase } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'The Reviews · The Reel Misfits',
  description: 'Every film and TV show on The Reel Misfits, with the YouTube reviewer consensus for each.',
};

type SortKey = 'score' | 'recent' | 'alpha' | 'count';
type TypeKey = 'all' | 'movie' | 'tv';
const isSortKey = (s: string | undefined): s is SortKey =>
  !!s && ['score', 'recent', 'alpha', 'count'].includes(s);
const isTypeKey = (s: string | undefined): s is TypeKey =>
  !!s && ['all', 'movie', 'tv'].includes(s);

const DEFAULT_PALETTE: [string, string, string] = ['#1a1a2e', '#16213e', '#0f3460'];

interface PageProps {
  searchParams: Promise<{ genre?: string; sort?: string; type?: string; search?: string }>;
}

async function getTMDBDetails(movieId: number) {
  const apiKey = process.env.TMDB_API_KEY;
  const data = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`,
    { next: { revalidate: 86400 } }
  ).then(r => r.ok ? r.json() : null);
  return data;
}

export default async function ReviewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const genreFilter = params.genre ?? 'all';
  const sortKey: SortKey = isSortKey(params.sort) ? params.sort : 'recent';
  const typeFilter: TypeKey = isTypeKey(params.type) ? params.type : 'all';
  const searchQuery = params.search?.trim().toLowerCase() ?? '';

  const [{ data: movies }, { data: shows }] = await Promise.all([
    supabase.from('movies').select('id, title, backdrop_path, reviews(recommend, score, posted_at)').order('title'),
    supabase.from('shows').select('id, title, backdrop_path, reviews(recommend, score, posted_at)').order('title'),
  ]);

  const moviesWithReviews = (movies || []).filter(m => Array.isArray(m.reviews) && m.reviews.length > 0);
  const showsWithReviews = (shows || []).filter(s => Array.isArray(s.reviews) && s.reviews.length > 0);

  const enriched = await Promise.all([
    ...moviesWithReviews.map(async (movie) => {
      const tmdb = await getTMDBDetails(movie.id);

      const reviews = movie.reviews as { recommend: boolean | null; score: number; posted_at: string }[];
      const MIN_REVIEWS = 4;
      const scoredReviews = reviews.filter(r => r.recommend !== null);
      const recCount = scoredReviews.filter(r => r.recommend === true).length;
      const passCount = scoredReviews.filter(r => r.recommend === false).length;
      const recPct = scoredReviews.length >= MIN_REVIEWS ? Math.round((recCount / scoredReviews.length) * 100) : null;
      const avgScore = reviews.reduce((sum, r) => sum + (r.score ?? 0), 0) / reviews.length;
      const latestDate = reviews.reduce((latest, r) =>
        r.posted_at > latest ? r.posted_at : latest, reviews[0]?.posted_at ?? ''
      );

      const genres: string[] = tmdb?.genres?.map((g: { name: string }) => g.name) ?? [];
      const year = tmdb?.release_date ? parseInt(tmdb.release_date.substring(0, 4)) : 0;
      const posterUrl = tmdb?.poster_path
        ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}`
        : null;

      return {
        title: {
          id: String(movie.id),
          title: movie.title || 'Unknown',
          year,
          director: '',
          genre: genres,
          poster: DEFAULT_PALETTE,
          posterUrl: posterUrl ?? undefined,
          type: 'movie' as const,
          runtime: tmdb?.runtime ? `${tmdb.runtime}m` : undefined,
          synopsis: tmdb?.overview ?? '',
          slug: '',
          featured: false,
        },
        consensus: {
          score: Math.round(avgScore * 10),
          recPct,
          recCount,
          passCount,
          total: reviews.length,
        },
        latestDate,
        genres,
      };
    }),
    ...showsWithReviews.map(async (show) => {
      const apiKey = process.env.TMDB_API_KEY;
      const tmdb = await fetch(`https://api.themoviedb.org/3/tv/${show.id}?api_key=${apiKey}`, { next: { revalidate: 86400 } }).then(r => r.ok ? r.json() : null);

      const reviews = show.reviews as { recommend: boolean | null; score: number; posted_at: string }[];
      const MIN_REVIEWS = 4;
      const scoredReviews = reviews.filter(r => r.recommend !== null);
      const recCount = scoredReviews.filter(r => r.recommend === true).length;
      const passCount = scoredReviews.filter(r => r.recommend === false).length;
      const recPct = scoredReviews.length >= MIN_REVIEWS ? Math.round((recCount / scoredReviews.length) * 100) : null;
      const avgScore = reviews.reduce((sum, r) => sum + (r.score ?? 0), 0) / reviews.length;
      const latestDate = reviews.reduce((latest, r) => r.posted_at > latest ? r.posted_at : latest, reviews[0]?.posted_at ?? '');
      
      const genres: string[] = tmdb?.genres?.map((g: { name: string }) => g.name) ?? [];
      const year = tmdb?.first_air_date ? parseInt(tmdb.first_air_date.substring(0, 4)) : 0;
      const posterUrl = tmdb?.poster_path ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}` : null;

      return {
        title: {
          id: String(show.id),
          title: show.title || 'Unknown',
          year,
          director: '',
          genre: genres,
          poster: DEFAULT_PALETTE,
          posterUrl: posterUrl ?? undefined,
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
  ]);

  const allGenres = Array.from(
    new Set(enriched.flatMap(e => e.genres))
  ).sort();

  const filtered = enriched.filter(e => {
    if (typeFilter !== 'all' && e.title.type !== typeFilter) return false;
    if (genreFilter !== 'all' && !e.genres.includes(genreFilter)) return false;
    if (searchQuery && !e.title.title.toLowerCase().includes(searchQuery)) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (sortKey === 'alpha') return a.title.title.localeCompare(b.title.title);
    if (sortKey === 'recent') return b.latestDate.localeCompare(a.latestDate);
    if (sortKey === 'count') return b.consensus.total - a.consensus.total;
    // 'score' — sort by recommend % then review count as tiebreak
    const aPct = a.consensus.recPct ?? -1;
    const bPct = b.consensus.recPct ?? -1;
    if (aPct !== bPct) return bPct - aPct;
    return b.consensus.total - a.consensus.total;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-[1140px] w-full mx-auto px-4 sm:px-6 pt-4 flex-1 flex flex-col">

        <header className="pt-8 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-2 w-2 rounded-full bg-white/20 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#777777]">
              The Critics Database
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#333333] pb-4">
            <h1 className="text-4xl sm:text-6xl font-[950] uppercase tracking-[-0.02em] text-white leading-none">
              {searchQuery
                ? <><span className="text-[#E21D1D]">"{params.search}"</span></>
                : <>THE <span className="text-[#E21D1D]">REVIEWS</span></>
              }
            </h1>
            <div className="flex flex-col items-start sm:items-end">
              <p className="text-[11px] font-bold text-[#999999] uppercase tracking-widest">
                {searchQuery ? 'Search results' : 'The best reviews from across YouTube'}
              </p>
              <p className="text-[10px] font-black text-[#E21D1D] uppercase tracking-widest mt-1">
                {filtered.length} {searchQuery ? 'results' : 'Titles Analyzed'}
              </p>
            </div>
          </div>
        </header>

        <div className="mb-8 border-b border-[#333333] pb-8">
          <BrowseFilterBar
            genres={allGenres}
            activeType={typeFilter}
            activeGenre={genreFilter}
            activeSort={sortKey}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <p className="text-sm font-bold text-[#777777] uppercase tracking-widest">
              {moviesWithReviews.length === 0 && showsWithReviews.length === 0
                ? 'No reviews yet — run /api/sync to populate'
                : 'No titles match those filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10 pb-20">
            {filtered.map(({ title, consensus }) => (
              <TitleCard key={`${title.type}-${title.id}`} title={{ ...title as any, href: title.type === 'tv' ? `/show/${title.id}` : `/movie/${title.id}` }} consensus={consensus} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
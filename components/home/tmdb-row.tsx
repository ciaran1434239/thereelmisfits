import Link from 'next/link';
import { SectionHeading } from '@/components/ui/section-heading';
import { supabase } from '@/lib/supabase';
import { badgeClasses, BADGE_SIZE } from '@/lib/utils/score-tier';

interface TmdbRowProps {
  title: string;
  subtitle: string;
  endpoint: string;
  variant?: 'portrait' | 'landscape';
  /** When set, only show films that have at least this many scored reviews in our DB.
   *  Fetches 2 pages from TMDB (~40 results) so there's enough to filter down to 7. */
  minReviews?: number;
}

export async function TmdbRow({ title, subtitle, endpoint, variant = 'portrait', minReviews }: TmdbRowProps) {
  const TMDB_KEY = process.env.TMDB_API_KEY;
  const maxItems = variant === 'landscape' ? 4 : 7;

  // When filtering by review count we need a bigger pool — fetch 2 pages in parallel.
  const fetchPage = (page: number) =>
    fetch(`https://api.themoviedb.org/3/${endpoint}&page=${page}&api_key=${TMDB_KEY}`, { next: { revalidate: 86400 } })
      .then(r => r.ok ? r.json() : null).catch(() => null);

  const [page1, page2] = await Promise.all([
    fetchPage(1),
    minReviews ? fetchPage(2) : Promise.resolve(null),
  ]);

  const needsImage = (m: any) => variant === 'landscape' ? !!m.backdrop_path : !!m.poster_path;
  const pool = [
    ...((page1?.results ?? []) as any[]),
    ...((page2?.results ?? []) as any[]),
  ].filter(needsImage);

  if (!pool.length) return null;

  // Query reviews for the whole pool so we can filter by review count
  const poolIds = pool.map((m: any) => m.id);
  const { data: reviews } = await supabase
    .from('reviews')
    .select('movie_id, recommend')
    .in('movie_id', poolIds);

  const MIN_REVIEWS = 4;
  const reviewMap = new Map<number, { total: number; scored: number; recs: number }>();
  for (const r of reviews ?? []) {
    const e = reviewMap.get(r.movie_id) ?? { total: 0, scored: 0, recs: 0 };
    e.total++;
    if (r.recommend !== null) e.scored++;
    if (r.recommend === true) e.recs++;
    reviewMap.set(r.movie_id, e);
  }

  // If minReviews is set, keep only films with enough scored reviews; otherwise take first N
  const movies = minReviews
    ? pool.filter((m: any) => (reviewMap.get(m.id)?.scored ?? 0) >= minReviews).slice(0, maxItems)
    : pool.slice(0, maxItems);

  if (variant === 'landscape') {
    // ── Landscape variant: 4-col backdrop cards with title + score overlaid ────
    return (
      <section className="w-full">
        <SectionHeading label={subtitle} title={title} viewAllHref="/reviews" viewAllLabel="All reviews" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {movies.map((movie: any) => {
            const reviewed = reviewMap.get(movie.id);
            const pct = reviewed && reviewed.scored >= MIN_REVIEWS
              ? Math.round((reviewed.recs / reviewed.scored) * 100)
              : null;
            const badgeColor = pct !== null ? badgeClasses(pct) : null;
            return (
              <Link key={movie.id} href={`/movie/${movie.id}`} className="group relative block aspect-video overflow-hidden rounded-[6px] bg-[#1A1A1A] shadow-[0_4px_16px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.22)] transition-shadow duration-300">
                <img
                  src={`https://image.tmdb.org/t/p/w780${movie.backdrop_path}`}
                  alt={movie.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Gradient overlay — darkens bottom so text is readable */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {/* Score badge top-right */}
                {badgeColor && (
                  <div className={`absolute top-2 right-2 z-10 ${badgeColor} ${BADGE_SIZE}`}>
                    {pct}%
                  </div>
                )}
                {/* Title bottom-left */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-[12px] font-black text-white leading-snug line-clamp-2">
                    {movie.title}
                  </p>
                  {movie.release_date && (
                    <p className="text-[10px] text-white/50 mt-0.5">{movie.release_date.substring(0, 4)}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  // ── Portrait variant (default): 7-col poster grid ────────────────────────
  return (
    <section className="w-full">
      <SectionHeading label={subtitle} title={title} viewAllHref="/reviews" viewAllLabel="All reviews" />
      <div className="grid grid-cols-7 gap-x-2">
        {movies.map((movie: any) => {
          const reviewed = reviewMap.get(movie.id);
          const pct = reviewed && reviewed.scored >= MIN_REVIEWS
            ? Math.round((reviewed.recs / reviewed.scored) * 100)
            : null;
          const badgeColor = pct !== null ? badgeClasses(pct) : null;

          return (
            <Link key={movie.id} href={`/movie/${movie.id}`} className="group flex flex-col">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[6px] bg-[#1A1A1A] mb-2 shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-300">
                <img
                  src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                  alt={movie.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {badgeColor && (
                  <div className={`absolute top-1.5 right-1.5 ${badgeColor} ${BADGE_SIZE}`}>
                    {pct}%
                  </div>
                )}
              </div>
              <p className="text-[13px] font-[700] text-ink leading-snug line-clamp-2">
                {movie.title}
              </p>
              {movie.release_date && (
                <p className="text-[12px] text-subtle mt-0.5">{movie.release_date.substring(0, 4)}</p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

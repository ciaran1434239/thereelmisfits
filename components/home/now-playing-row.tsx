import Link from 'next/link';
import { SectionHeading } from '@/components/ui/section-heading';
import { supabase } from '@/lib/supabase';
import { badgeClasses, BADGE_SIZE } from '@/lib/utils/score-tier';
import { SmartPoster } from '@/components/ui/smart-poster';

export async function NowPlayingRow({ excludeMovieId }: { excludeMovieId?: number | null } = {}) {
  const TMDB_KEY = process.env.TMDB_API_KEY;

  // movie/now_playing?region=GB is TMDB's dedicated "currently in theatres" endpoint.
  // We use a strict 21-day window — anything older has likely already moved to streaming.
  // cache: 'no-store' so this always reflects today's cinema listings, never serves stale HTML.
  const today = new Date();
  const twentyOneDaysAgo = new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000);
  const pastStr = twentyOneDaysAgo.toISOString().slice(0, 10);

  const [d1, d2] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_KEY}&region=GB&language=en-US&page=1`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_KEY}&region=GB&language=en-US&page=2`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
  ]);
  const all = [...(d1?.results ?? []), ...(d2?.results ?? [])] as any[];

  // Keep only films with a poster released in the last 21 days, sorted by popularity.
  // Exclude the active hero film so it doesn't appear in two places at once.
  const movies = all
    .filter((m: any) => m.poster_path && m.release_date >= pastStr && m.id !== excludeMovieId && m.original_language === 'en')
    .sort((a: any, b: any) => b.popularity - a.popularity)
    .slice(0, 7);

  if (!movies.length) return null;

  const MIN_REVIEWS = 4;
  const movieIds = movies.map((m: any) => m.id);
  const { data: reviews } = await supabase
    .from('reviews')
    .select('movie_id, recommend')
    .in('movie_id', movieIds)
    .not('recommend', 'is', null);

  const reviewMap = new Map<number, { scored: number; recs: number }>();
  for (const r of reviews ?? []) {
    const e = reviewMap.get(r.movie_id) ?? { scored: 0, recs: 0 };
    e.scored++;
    if (r.recommend) e.recs++;
    reviewMap.set(r.movie_id, e);
  }

  return (
    <section className="w-full">
      <SectionHeading label="What's on screens this week" title="Now in Cinemas" viewAllHref="/reviews" viewAllLabel="All reviews" />

      <div className="grid grid-cols-7 gap-x-2">
        {movies.map((movie: any) => {
          const reviewed = reviewMap.get(movie.id);
          // Only show our own score once we hit the MIN_REVIEWS threshold
          const pct = reviewed && reviewed.scored >= MIN_REVIEWS
            ? Math.round((reviewed.recs / reviewed.scored) * 100)
            : null;
          const badgeColor = pct !== null ? badgeClasses(pct) : null;

          return (
            <Link key={movie.id} href={`/movie/${movie.id}`} className="group flex flex-col">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[6px] bg-[#1A1A1A] mb-2 shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-300">
                <SmartPoster
                  src={movie.poster_path}
                  title={movie.title}
                  size="w185"
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
              <p className="text-[12px] text-subtle mt-0.5">
                {movie.release_date?.substring(0, 4)}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

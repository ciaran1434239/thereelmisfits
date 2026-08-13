import Link from 'next/link';
import { SectionHeading } from '@/components/ui/section-heading';

export async function ComingSoonRow() {
  const TMDB_KEY = process.env.TMDB_API_KEY;

  // movie/upcoming?region=GB is TMDB's dedicated "coming to theatres" endpoint
  // calibrated to regional cinema calendars — far more accurate than discover/movie
  // which returns 1000s of tiny global theatrical releases.
  // We fetch 2 pages so we have enough to filter, then strictly enforce:
  //   - release_date strictly after today (nothing already out)
  //   - release_date within 60 days (nothing too far away)
  //   - must have a poster
  // Sort by date ascending so nearest release is first.
  const todayStr = new Date().toISOString().slice(0, 10);
  const sixtyStr = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [d1, d2] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${TMDB_KEY}&region=GB&language=en-US&page=1`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${TMDB_KEY}&region=GB&language=en-US&page=2`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
  ]);
  const all = [...(d1?.results ?? []), ...(d2?.results ?? [])] as any[];

  const movies = all
    .filter((m) => m.poster_path && m.release_date > todayStr && m.release_date <= sixtyStr)
    .sort((a, b) => a.release_date.localeCompare(b.release_date))
    .slice(0, 7);

  if (!movies.length) return null;

  function fmtDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  }

  return (
    <section className="w-full">
      <SectionHeading label="Upcoming theatrical releases" title="Coming Soon" viewAllHref="/reviews" viewAllLabel="All releases" />

      <div className="grid grid-cols-7 gap-x-3">
        {movies.map((movie: any) => (
          <Link key={movie.id} href={`/movie/${movie.id}`} className="group flex flex-col">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[6px] bg-[#1A1A1A] mb-2 shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.6)] hover:-translate-y-1 transition-all duration-300">
              <img
                src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                alt={movie.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {movie.release_date && (
                <div className="absolute bottom-1.5 left-1.5 bg-black/55 text-white/80 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {fmtDate(movie.release_date)}
                </div>
              )}
            </div>
            <p className="text-[13px] font-[700] text-white leading-snug line-clamp-2 group-hover:text-[#C8201F] transition-colors">
              {movie.title}
            </p>
            <p className="text-[12px] text-white/40 mt-0.5">
              {movie.release_date?.substring(0, 4)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

import Link from 'next/link';
import { getPosterRailFilms } from '@/lib/data/verdicts-feed';

const TMDB_KEY = process.env.TMDB_API_KEY;

async function fetchPoster(movieId: number): Promise<string | null> {
  if (!TMDB_KEY) return null;
  const data = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_KEY}`,
    { next: { revalidate: 3600 } },
  ).then(r => (r.ok ? r.json() : null)).catch(() => null);
  return data?.poster_path ? `https://image.tmdb.org/t/p/w342${data.poster_path}` : null;
}

export async function PosterRail() {
  const films = await getPosterRailFilms(6);
  if (!films.length) return null;

  const posterUrls = await Promise.all(films.map(f => fetchPoster(f.movieId)));

  return (
    <aside className="sticky top-[57px] flex flex-col gap-3 max-h-[calc(100vh-80px)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <p
        className="text-[9px] font-black uppercase tracking-[0.25em] pb-2"
        style={{ color: 'var(--ink-muted)', borderBottom: '1px solid var(--bg-panel-edge)' }}
      >
        Most Reviewed
      </p>

      {films.map((film, i) => {
        const posterUrl = posterUrls[i];
        const scoreColor =
          film.pctPositive >= 70 ? 'var(--score-green)' :
          film.pctPositive >= 40 ? '#E0A22B' :
          '#F87171';

        return (
          <Link
            key={film.movieId}
            href={`/movie/${film.movieId}` as any}
            className="flex gap-3 group"
            style={{ border: '1px solid var(--bg-panel-edge)', padding: '8px' }}
          >
            {/* Poster thumbnail */}
            <div
              className="shrink-0 relative overflow-hidden"
              style={{ width: 52, aspectRatio: '2/3', background: 'var(--bg-panel-edge)' }}
            >
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={film.movieTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[18px]" style={{ color: 'var(--ink-muted)' }}>🎬</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex flex-col justify-between py-0.5">
              <p className="text-[11px] font-black text-white line-clamp-2 leading-tight group-hover:text-[#C8201F] transition-colors">
                {film.movieTitle}
              </p>
              <div>
                <p className="text-[13px] font-black leading-none tabular-nums" style={{ color: scoreColor }}>
                  {film.pctPositive}%
                </p>
                <p className="text-[9px] font-bold mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                  {film.reviewCount} reviews
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </aside>
  );
}

import Link from 'next/link';
import { getPosterRailFilms } from '@/lib/data/verdicts-feed';
import { SectionTitle } from '@/components/home/section-title';

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
  const posters = await Promise.all(films.map(f => fetchPoster(f.movieId)));

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 sm:pt-20">
      <SectionTitle title="Most Reviewed This Month" href={'/movies' as any} hrefLabel="All movies" />

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 mt-6">
        {films.map((f, i) => (
          <Link key={f.movieId} href={`/movie/${f.movieId}` as any} className="group block">
            <div className="overflow-hidden" style={{ aspectRatio: '2/3', background: '#E4DFD3' }}>
              {posters[i] && (
                <img src={posters[i]!} alt={f.movieTitle} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200" />
              )}
            </div>
            <p
              className="mt-2.5 text-[15px] leading-tight line-clamp-1 group-hover:underline"
              style={{ fontFamily: 'var(--font-editorial, serif)', fontWeight: 700, color: '#151515' }}
            >
              {f.movieTitle}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: '#6B665C' }}>
              <span className="font-bold" style={{ color: f.pctPositive >= 50 ? '#1E8E3E' : '#C8201F' }}>{f.pctPositive}%</span>
              {' '}· {f.reviewCount} reviews
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

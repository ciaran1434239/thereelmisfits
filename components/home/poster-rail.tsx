import Link from 'next/link';
import { getPosterRailFilms } from '@/lib/data/verdicts-feed';
import { fetchPoster } from '@/lib/data/tmdb-poster';
import { SectionTitle } from '@/components/home/section-title';

export async function PosterRail() {
  const films = await getPosterRailFilms(6);
  if (!films.length) return null;
  const posters = await Promise.all(films.map(f => fetchPoster(f.movieId, 'w342')));

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-20 sm:pt-28">
      <SectionTitle title="Most reviewed this month" href={'/movies' as any} hrefLabel="All movies" />

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 mt-8">
        {films.map((f, i) => (
          <Link key={f.movieId} href={`/movie/${f.movieId}` as any} className="group block">
            <div className="overflow-hidden transition-transform duration-150 group-hover:-rotate-1 group-hover:scale-[1.03]" style={{ aspectRatio: '2/3', background: '#DDD6C6' }}>
              {posters[i] && <img src={posters[i]!} alt={f.movieTitle} className="w-full h-full object-cover" />}
            </div>
            <p className="mt-2.5 line-clamp-1 group-hover:text-[#C8201F]" style={{ fontFamily: 'var(--font-display), Impact, sans-serif', fontSize: '1.5rem', lineHeight: 1, color: '#151515' }}>
              {f.movieTitle}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: '#5F5A50' }}>
              <span className="font-bold" style={{ color: f.pctPositive >= 50 ? '#1E8E3E' : '#C8201F' }}>{f.pctPositive}%</span>
              {' '}· {f.reviewCount} reviews
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

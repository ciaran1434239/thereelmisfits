import Link from 'next/link';
import { getPosterRailFilms } from '@/lib/data/verdicts-feed';
import { fetchPoster } from '@/lib/data/tmdb-poster';
import { SectionTitle } from '@/components/home/section-title';

export async function PosterRail() {
  const films = await getPosterRailFilms(6);
  if (!films.length) return null;
  const posters = await Promise.all(films.map(f => fetchPoster(f.movieId, 'w342')));

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-24 sm:pt-32">
      <SectionTitle title="Most reviewed this month" href={'/movies' as any} hrefLabel="All movies" />

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 mt-8">
        {films.map((f, i) => (
          <Link key={f.movieId} href={`/movie/${f.movieId}` as any} className="group block">
            <div className="overflow-hidden " style={{ aspectRatio: '2/3', background: '#E8E8E8' }}>
              {posters[i] && <img src={posters[i]!} alt={f.movieTitle} className="w-full h-full object-cover" />}
            </div>
            <p className="mt-2.5 line-clamp-1 group-hover:underline" style={{ fontFamily: 'var(--font-headline), Georgia, serif', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2, color: '#111' }}>
              {f.movieTitle}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: '#555' }}>
              <span className="font-bold" style={{ color: '#111' }}>{f.pctPositive}%</span>
              {' '}· {f.reviewCount} reviews
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

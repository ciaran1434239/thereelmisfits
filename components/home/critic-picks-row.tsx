import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { badgeClasses } from '@/lib/utils/score-tier';

export async function CriticPicksRow() {
  const TMDB_KEY = process.env.TMDB_API_KEY;

  const { data: allReviews } = await supabase
    .from('reviews')
    .select('movie_id, recommend, movies(id, title)');

  if (!allReviews?.length) return null;

  // Find movies with 3+ reviews and 70%+ rec rate
  const movieMap = new Map<number, { title: string; total: number; recs: number }>();
  for (const r of allReviews as any[]) {
    const movie = Array.isArray(r.movies) ? r.movies[0] : r.movies;
    if (!movie) continue;
    const existing = movieMap.get(movie.id) ?? { title: movie.title, total: 0, recs: 0 };
    existing.total++;
    if (r.recommend) existing.recs++;
    movieMap.set(movie.id, existing);
  }

  const picks = Array.from(movieMap.entries())
    .filter(([, v]) => v.total >= 3 && Math.round((v.recs / v.total) * 100) >= 75)
    .sort((a, b) => {
      const pctA = Math.round((a[1].recs / a[1].total) * 100);
      const pctB = Math.round((b[1].recs / b[1].total) * 100);
      return pctB - pctA || b[1].total - a[1].total;
    })
    .slice(0, 6);

  if (!picks.length) return null;

  const enriched = await Promise.all(
    picks.map(async ([id, { title, total, recs }]) => {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`,
        { next: { revalidate: 86400 } }
      );
      const data = res.ok ? await res.json() : null;
      return {
        id,
        title,
        posterPath: data?.poster_path ?? null,
        year: data?.release_date?.substring(0, 4) ?? '',
        pct: Math.round((recs / total) * 100),
        total,
      };
    })
  );

  return (
    <section className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 border-b border-[#2A2A2A] pb-4">
        <div className="flex items-center gap-3">
          <Star size={14} className="text-[#E21D1D]" fill="#E21D1D" />
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#777777]">Critic Picks</h2>
            <p className="text-[10px] font-bold text-[#555555] uppercase tracking-widest mt-1">
              3+ reviews · 75% or higher approval
            </p>
          </div>
        </div>
        <Link href="/reviews" className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#777777] hover:text-white transition-colors pb-1">
          All reviews <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-6">
        {enriched.map(({ id, title, posterPath, year, pct, total }) => (
          <Link key={id} href={`/movie/${id}`} className="group flex flex-col">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-[#222222] mb-2 shadow-sm">
              {posterPath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w342${posterPath}`}
                  alt={title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center px-2">
                  <span className="text-[9px] text-[#777777] font-bold uppercase text-center">{title}</span>
                </div>
              )}
              <div className={`absolute top-1.5 right-1.5 ${badgeClasses(pct)} text-[9px] font-black px-1.5 py-0.5 rounded-sm shadow`}>
                {pct}%
              </div>
            </div>
            <p className="text-[11px] font-black uppercase tracking-tight text-white leading-snug line-clamp-2 group-hover:text-white transition-colors">
              {title}
            </p>
            {year && <p className="text-[10px] text-[#777777] font-bold mt-0.5">{year}</p>}
            <p className="text-[9px] text-[#777777] font-bold uppercase tracking-widest mt-0.5">
              {total} reviews
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

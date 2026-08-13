import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { badgeClasses } from '@/lib/utils/score-tier';

interface TopTenSidebarProps {
  title?: string;
  subtitle?: string;
  dark?: boolean;
}

export async function TopTenSidebar({
  title = "Most Reviewed",
  subtitle = "By creator consensus",
  dark = false,
}: TopTenSidebarProps) {
  const TMDB_KEY = process.env.TMDB_API_KEY;

  const { data: reviews } = await supabase
    .from('reviews')
    .select('movie_id, recommend, movies(id, title)');

  if (!reviews || reviews.length === 0) return null;

  const countMap = new Map<number, { title: string; total: number; recs: number }>();
  for (const r of reviews as any[]) {
    const movie = Array.isArray(r.movies) ? r.movies[0] : r.movies;
    if (!movie) continue;
    const existing = countMap.get(movie.id) ?? { title: movie.title, total: 0, recs: 0 };
    existing.total++;
    if (r.recommend) existing.recs++;
    countMap.set(movie.id, existing);
  }

  const sorted = Array.from(countMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  const enriched = await Promise.all(
    sorted.map(async ([id, { title: movieTitle, total, recs }]) => {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`,
        { next: { revalidate: 86400 } }
      );
      const data = res.ok ? await res.json() : null;
      const pct = total === 0 ? 0 : Math.round((recs / total) * 100);
      return { id, title: movieTitle, posterPath: data?.poster_path ?? null, total, pct };
    })
  );

  const borderCls = dark ? 'border-white/10' : 'border-[#2A2A2A]';
  const titleCls = dark ? 'text-white/60' : 'text-[#777777]';
  const subtitleCls = dark ? 'text-white/30' : 'text-[#555555]';
  const numCls = dark ? 'text-white/20' : 'text-[#444444]';
  const movieTitleCls = dark ? 'text-white' : 'text-white';
  const countCls = dark ? 'text-white/40' : 'text-[#777777]';
  const linkCls = dark ? 'text-white/40' : 'text-[#777777]';

  return (
    <section className="w-full flex flex-col">
      <div className={`flex items-center gap-3 mb-4 border-b ${borderCls} pb-3`}>
        <div className="h-2 w-2 rounded-full bg-[#E21D1D]" />
        <div>
          <h2 className={`text-[11px] font-black uppercase tracking-[0.2em] ${titleCls}`}>{title}</h2>
          {subtitle && (
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${subtitleCls}`}>{subtitle}</p>
          )}
        </div>
      </div>

      <ol className="flex flex-col mb-4">
        {enriched.map(({ id, title: movieTitle, posterPath, total, pct }, index) => {
          const badgeColor = badgeClasses(pct);
          return (
            <li key={id} className={`group flex items-center gap-3 py-2.5 border-b last:border-b-0 ${borderCls}`}>
              <span className={`text-xl font-black w-5 shrink-0 group-hover:text-white transition-colors ${numCls}`}>
                {index + 1}
              </span>
              <div className="w-9 h-12 rounded shrink-0 overflow-hidden bg-[#222222]">
                {posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${posterPath}`}
                    alt={movieTitle}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2A2A2A]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/movie/${id}`}
                  className={`block text-[12px] font-black uppercase italic leading-tight hover:text-white transition-colors mb-1 truncate ${movieTitleCls}`}
                >
                  {movieTitle}
                </Link>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${badgeColor}`}>{pct}%</span>
                  <span className={`text-[10px] font-bold ${countCls}`}>{total} {total === 1 ? 'review' : 'reviews'}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <Link href="/reviews" className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest ${linkCls} hover:text-white transition-colors self-start`}>
        See all reviews <ArrowRight size={14} />
      </Link>
    </section>
  );
}

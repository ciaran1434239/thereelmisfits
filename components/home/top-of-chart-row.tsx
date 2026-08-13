import Link from 'next/link';
import { SectionHeading } from '@/components/ui/section-heading';
import { supabase } from '@/lib/supabase';
import { badgeClasses, BADGE_SIZE, UNSCORED_BADGE } from '@/lib/utils/score-tier';
import { PosterPlaceholder } from '@/components/ui/poster-placeholder';

interface TopOfChartProps {
  title?: string;
  subtitle?: string;
  offset?: number;
  sortBy?: 'count' | 'score';
  dark?: boolean;
}

export async function TopOfChartRow({
  title = "Most Reviewed",
  subtitle = "Titles with the most creator coverage",
  offset = 0,
  sortBy = 'count',
}: TopOfChartProps) {
  const TMDB_KEY = process.env.TMDB_API_KEY;

  const now = Date.now();
  const DAY_MS = 86_400_000;

  const windowDays = sortBy === 'count' ? 14 : 60;
  const cutoff = new Date(now - windowDays * DAY_MS).toISOString();

  const { data: allReviews } = await supabase
    .from('reviews')
    .select('movie_id, recommend, posted_at, movies(id, title, release_date)')
    .gte('posted_at', cutoff);

  if (!allReviews || allReviews.length === 0) {
    return <EmptyState title={title} subtitle={subtitle} />;
  }

  const ninetyDaysAgo = now - 90 * DAY_MS;

  function reviewWeight(postedAt: string): number {
    const ageDays = (now - new Date(postedAt).getTime()) / DAY_MS;
    if (sortBy === 'count') return Math.pow(0.80, ageDays);
    if (ageDays <= 7)  return 1.0;
    if (ageDays <= 30) return 0.5;
    return 0.25;
  }

  const movieMap = new Map<number, { title: string; releaseDate: string | null; total: number; recs: number; weightedScore: number }>();
  for (const r of allReviews as any[]) {
    const movie = Array.isArray(r.movies) ? r.movies[0] : r.movies;
    if (!movie) continue;
    const existing = movieMap.get(movie.id) ?? {
      title: movie.title, releaseDate: movie.release_date ?? null,
      total: 0, recs: 0, weightedScore: 0,
    };
    existing.total++;
    if (r.recommend) existing.recs++;
    existing.weightedScore += reviewWeight(r.posted_at ?? '2020-01-01');
    movieMap.set(movie.id, existing);
  }

  const minReviews = sortBy === 'score' ? 4 : 1;
  const sorted = Array.from(movieMap.entries())
    .filter(([, v]) => {
      if (v.total < minReviews) return false;
      if (sortBy === 'count' && v.releaseDate) {
        return new Date(v.releaseDate).getTime() >= ninetyDaysAgo;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') {
        const pctA = Math.round((a[1].recs / a[1].total) * 100);
        const pctB = Math.round((b[1].recs / b[1].total) * 100);
        return pctB - pctA || b[1].weightedScore - a[1].weightedScore;
      }
      return b[1].weightedScore - a[1].weightedScore;
    })
    .slice(offset, offset + 7);

  if (sorted.length === 0) return <EmptyState title={title} subtitle={subtitle} />;

  const enriched = await Promise.all(
    sorted.map(async ([id, { title: movieTitle, total, recs }]) => {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`,
        { next: { revalidate: 86400 } }
      );
      const data = res.ok ? await res.json() : null;
      const pct = total === 0 ? null : Math.round((recs / total) * 100);
      return { id, title: movieTitle, posterPath: data?.poster_path ?? null, year: data?.release_date?.substring(0, 4) ?? '', pct, total };
    })
  );

  return (
    <section className="w-full">
      <SectionHeading label={subtitle} title={title} viewAllHref="/reviews" viewAllLabel="All reviews" />
      <div className="grid grid-cols-7 gap-x-2">
        {enriched.map(({ id, title: movieTitle, posterPath, year, pct, total }) => {
          const showBadge = pct !== null && total >= 4;
          const badgeColor = showBadge ? badgeClasses(pct!) : null;
          return (
            <Link key={id} href={`/movie/${id}`} className="group flex flex-col">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[6px] bg-[#1A1A1A] mb-2 shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-300">
                {posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${posterPath}`}
                    alt={movieTitle}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <PosterPlaceholder title={movieTitle} />
                )}
                {showBadge && badgeColor ? (
                  <div className={`absolute top-1.5 right-1.5 z-10 ${BADGE_SIZE} ${badgeColor}`}>{pct}%</div>
                ) : (
                  <div className={`absolute top-1.5 right-1.5 z-10 ${BADGE_SIZE} ${UNSCORED_BADGE}`}>{total}</div>
                )}
              </div>
              <p className="text-[13px] font-[700] text-white leading-snug line-clamp-2">{movieTitle}</p>
              {year && <p className="text-[12px] text-subtle mt-0.5">{year}</p>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="w-full">
      <div className="flex items-center gap-3 mb-5 border-b pb-3 border-white/10">
        <div className="h-2 w-2 rounded-full bg-white/15" />
        <div>
          <h2 className="text-[22px] font-black uppercase tracking-[-0.02em] leading-none text-white">{title}</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C8201F]">{subtitle}</p>
        </div>
      </div>
      <div className="w-full py-10 border-2 border-dashed rounded-xl flex items-center justify-center border-white/10">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">No reviews yet</span>
      </div>
    </section>
  );
}

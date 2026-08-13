import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { badgeClasses } from '@/lib/utils/score-tier';
import { SectionHeading } from '@/components/ui/section-heading';

export async function RecentlyScored() {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, posted_at, recommend, movie_id, movies(id, title, poster_path)')
    .not('recommend', 'is', null)
    .not('movie_id', 'is', null)
    .order('posted_at', { ascending: false })
    .limit(100);

  if (!reviews?.length) return null;

  const seen = new Set<number>();
  const items: { id: number; title: string; posterPath: string | null; pct: number }[] = [];

  const { data: allReviews } = await supabase
    .from('reviews')
    .select('movie_id, recommend')
    .not('recommend', 'is', null)
    .not('movie_id', 'is', null);

  const scoreMap = new Map<number, { t: number; r: number }>();
  for (const r of allReviews ?? []) {
    const e = scoreMap.get(r.movie_id) ?? { t: 0, r: 0 };
    e.t++; if (r.recommend) e.r++;
    scoreMap.set(r.movie_id, e);
  }

  for (const r of reviews as any[]) {
    const m = Array.isArray(r.movies) ? r.movies[0] : r.movies;
    if (!m || seen.has(m.id)) continue;
    seen.add(m.id);
    const counts = scoreMap.get(m.id);
    if (!counts || counts.t < 4) continue;
    items.push({
      id: m.id,
      title: m.title,
      posterPath: m.poster_path ?? null,
      pct: Math.round((counts.r / counts.t) * 100),
    });
    if (items.length >= 7) break; // cap at 7
  }

  if (!items.length) return null;

  return (
    <section className="w-full">
      {/* Link lives in the header — not at the end of the card row */}
      <SectionHeading label="Fresh verdicts" title="Recently Scored" viewAllHref="/reviews" viewAllLabel="All reviews" />

      <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(({ id, title, posterPath, pct }) => {
          const badge = badgeClasses(pct);
          return (
            <Link
              key={id}
              href={`/movie/${id}` as any}
              className="group flex-none w-[150px]"
            >
              {/* Fixed height matches portrait card in 7-col grid — never changes with content */}
              <div className="relative w-full h-[225px] overflow-hidden rounded-lg bg-[#222222] mb-2 shadow-sm">
                {posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${posterPath}`}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1E1E1E] to-[#141414] px-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <span className="text-[16px] font-black text-white/40">
                        {(title || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30 text-center line-clamp-3">
                      {title}
                    </span>
                  </div>
                )}
                <div className={`absolute top-1.5 right-1.5 ${badge} text-[10px] font-black px-1.5 py-0.5`}>
                  {pct}%
                </div>
              </div>
              {/* Text area — fixed two-line height so card bottoms align */}
              <div className="h-[36px] overflow-hidden">
                <p className="text-[12px] font-bold text-white/80 leading-snug line-clamp-2">{title}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

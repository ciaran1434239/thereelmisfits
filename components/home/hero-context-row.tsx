import Link from 'next/link';
import { ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AvatarImg } from '@/components/ui/avatar-img';

/** Shows a compact strip of verdict cards for the most-reviewed movie —
 *  connecting the hero banner to real review content below it. */
export async function HeroContextRow() {
  // Find the most-reviewed movie (same logic as hero picks)
  const { data: reviews } = await supabase
    .from('reviews')
    .select('movie_id, recommend, snippet, posted_at, movies(id, title), creators(id, name, handle, avatar_url)')
    .not('movie_id', 'is', null)
    .order('posted_at', { ascending: false })
    .limit(300);

  if (!reviews?.length) return null;

  const countMap = new Map<number, number>();
  for (const r of reviews as any[]) {
    const m = Array.isArray(r.movies) ? r.movies[0] : r.movies;
    if (!m) continue;
    countMap.set(m.id, (countMap.get(m.id) ?? 0) + 1);
  }
  const topId = Array.from(countMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!topId) return null;

  const filmReviews = (reviews as any[])
    .filter(r => {
      const m = Array.isArray(r.movies) ? r.movies[0] : r.movies;
      return m?.id === topId && r.recommend !== null;
    })
    .slice(0, 4);

  if (!filmReviews.length) return null;

  const movie = (() => {
    const r = filmReviews[0]!;
    return Array.isArray(r.movies) ? r.movies[0] : r.movies;
  })();

  return (
    <div className="w-full border-t border-white/[0.06] bg-white/[0.02]">
      <div className="max-w-[1060px] mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">
            What they said about
          </span>
          <Link
            href={`/movie/${topId}` as any}
            className="text-[9px] font-black uppercase tracking-[0.25em] text-[#E21D1D] hover:text-white transition-colors flex items-center gap-1"
          >
            {movie?.title} <ArrowRight size={9} />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filmReviews.map((r: any) => {
            const creator = Array.isArray(r.creators) ? r.creators[0] : r.creators;
            return (
              <div
                key={r.id}
                className="flex-none flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 min-w-[180px] max-w-[220px]"
              >
                <AvatarImg
                  src={creator?.avatar_url}
                  name={creator?.name || '?'}
                  className="w-7 h-7 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-white leading-tight line-clamp-1">{creator?.name}</p>
                  <span className={`inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold ${
                    r.recommend ? 'text-[#2BA640]' : 'text-[#E21D1D]'
                  }`}>
                    {r.recommend
                      ? <><ThumbsUp size={9} /> Recommends</>
                      : <><ThumbsDown size={9} /> Skip it</>
                    }
                  </span>
                </div>
              </div>
            );
          })}
          <Link
            href={`/movie/${topId}` as any}
            className="flex-none flex items-center justify-center bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors min-w-[100px]"
          >
            See all →
          </Link>
        </div>
      </div>
    </div>
  );
}

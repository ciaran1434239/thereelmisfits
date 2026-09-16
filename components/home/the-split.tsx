import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SectionHeading } from '@/components/ui/section-heading';
import { PosterPlaceholder } from '@/components/ui/poster-placeholder';

export async function TheSplit() {
  const TMDB_KEY = process.env.TMDB_API_KEY;

  const now = Date.now();
  const DAY_MS = 86_400_000;
  const thirtyDaysAgo = new Date(now - 30 * DAY_MS).toISOString();

  // Fetch all scored reviews + posted_at so we can weight toward recent coverage
  const { data: reviews } = await supabase
    .from('reviews')
    .select('movie_id, recommend, posted_at, movies(id, title)')
    .not('movie_id', 'is', null)
    .not('recommend', 'is', null);

  if (!reviews?.length) return null;

  const agg = new Map<number, { title: string; t: number; r: number; recent: number }>();
  for (const rv of reviews as any[]) {
    const m = Array.isArray(rv.movies) ? rv.movies[0] : rv.movies;
    if (!m) continue;
    const e = agg.get(m.id) ?? { title: m.title, t: 0, r: 0, recent: 0 };
    e.t++;
    if (rv.recommend) e.r++;
    if (rv.posted_at && rv.posted_at >= thirtyDaysAgo) e.recent++;
    agg.set(m.id, e);
  }

  // Stable weekly seed — changes each Monday so the selection rotates naturally.
  // Films with recent reviews surface first; within that, a deterministic shuffle
  // prevents the same order every page load.
  const weekSeed = Math.floor(now / (7 * DAY_MS));
  function seededRandom(id: number): number {
    const x = Math.sin(id * 9301 + weekSeed * 49297) * 10000;
    return x - Math.floor(x);
  }

  function splitScore(id: number, v: { t: number; r: number; recent: number }): number {
    // Recency weight: films reviewed in the last 30 days score higher
    return v.recent * 3 + seededRandom(id);
  }

  // Primary: 35–65% AND at least 5 scored reviews (genuinely contested)
  const primary = Array.from(agg.entries())
    .filter(([, v]) => {
      if (v.t < 5) return false;
      const pct = Math.round((v.r / v.t) * 100);
      return pct >= 35 && pct <= 65;
    })
    .sort(([idA, vA], [idB, vB]) => splitScore(idB, vB) - splitScore(idA, vA));

  // Fallback: widen to 30–70% if we need to fill 7 slots
  const fallback = Array.from(agg.entries())
    .filter(([, v]) => {
      if (v.t < 5) return false;
      const pct = Math.round((v.r / v.t) * 100);
      return pct >= 30 && pct <= 70;
    })
    .sort(([idA, vA], [idB, vB]) => splitScore(idB, vB) - splitScore(idA, vA));

  const primaryIds = new Set(primary.map(([id]) => id));
  const combined = [
    ...primary,
    ...fallback.filter(([id]) => !primaryIds.has(id)),
  ].slice(0, 7);

  const divided = combined;

  if (!divided.length) return null;

  const enriched = await Promise.all(
    divided.map(async ([id, { title, t, r }]) => {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`,
        { next: { revalidate: 86400 } }
      ).then(r => r.ok ? r.json() : null).catch(() => null);
      const pct = Math.round((r / t) * 100);
      return { id, title, posterPath: res?.poster_path ?? null, pct, total: t };
    })
  );

  return (
    <section className="w-full">
      <SectionHeading
        label="Critics couldn't agree — you decide"
        title="The Split"
        viewAllHref="/reviews"
        viewAllLabel="All reviews"
      />

      {/* Explanatory label */}
      <p className="text-[11px] text-subtle mb-4 -mt-2">
        Films where the green/red bar shows exactly how critics were divided. Closer to 50/50 = more contested.
      </p>

      <div className="grid grid-cols-7 gap-x-2">
        {enriched.map(({ id, title, posterPath, pct, total }) => (
          <Link key={id} href={`/movie/${id}` as any} className="group flex flex-col">
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#1A1A1A] mb-2 border border-[#8F8A82] group-hover:shadow-[3px_3px_0_0_#C8201F] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-[#C8201F] transition-all duration-[120ms]">
              {posterPath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w185${posterPath}`}
                  alt={title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <PosterPlaceholder title={title} />
              )}
            </div>

            {/* Dual-colour split bar — 6px thick, solid fills */}
            <div className="w-full h-[6px] overflow-hidden flex mb-1.5">
              <div className="bg-[#16A34A] h-full" style={{ width: `${pct}%` }} />
              <div className="bg-[#C8201F] h-full flex-1" />
            </div>

            {/* Flanking percentages */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-black text-[#16A34A]">{pct}%</span>
              <span className="text-[9px] font-black text-[#C8201F]">{100 - pct}%</span>
            </div>

            <p className="text-[12px] font-[700] text-ink leading-snug line-clamp-1">
              {title}
            </p>
            <p className="text-[10px] text-subtle mt-0.5">{total} reviews</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

import Link from 'next/link';
import { SectionHeading } from '@/components/ui/section-heading';
import { supabase } from '@/lib/supabase';
import { coverUrl } from '@/lib/igdb';
import { PosterPlaceholder } from '@/components/ui/poster-placeholder';
import { badgeClasses } from '@/lib/utils/score-tier';

export async function GamingHomeRow() {
  const { data: reviewRows } = await supabase
    .from('reviews')
    .select('game_id, recommend')
    .not('game_id', 'is', null);

  if (!reviewRows?.length) return null;

  const countMap = new Map<number, { t: number; scored: number; recs: number }>();
  for (const r of reviewRows as any[]) {
    const e = countMap.get(r.game_id) ?? { t: 0, scored: 0, recs: 0 };
    e.t++;
    if (r.recommend !== null) { e.scored++; if (r.recommend) e.recs++; }
    countMap.set(r.game_id, e);
  }

  const topIds = Array.from(countMap.entries())
    .sort((a, b) => b[1].t - a[1].t)
    .slice(0, 7)
    .map(([id]) => id);

  if (!topIds.length) return null;

  const { data: games } = await supabase
    .from('games')
    .select('id, title, cover_image_id, slug')
    .in('id', topIds);

  if (!games?.length) return null;

  const gameMap = new Map((games as any[]).map(g => [g.id, g]));
  const MIN_REVIEWS = 4;

  const items = topIds
    .map(id => {
      const game = gameMap.get(id) as any;
      if (!game) return null;
      const counts = countMap.get(id)!;
      const pct = counts.scored >= MIN_REVIEWS
        ? Math.round((counts.recs / counts.scored) * 100)
        : null;
      return { game, pct, total: counts.t };
    })
    .filter(Boolean) as { game: any; pct: number | null; total: number }[];

  if (!items.length) return null;

  return (
    <section className="w-full">
      <SectionHeading
        label="YouTube game critics"
        title="Gaming"
        viewAllHref="/games"
        viewAllLabel="All Games"
      />

      {/* Portrait 2:3 grid — same card spec as every other section */}
      <div className="grid grid-cols-7 gap-x-2">
        {items.map(({ game, pct, total }) => {
          const badgeColor = pct !== null ? badgeClasses(pct) : null;
          return (
            <Link key={game.id} href={`/game/${game.id}` as any} className="group flex flex-col">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-[#222222] mb-2 shadow-sm">
                {game.cover_image_id ? (
                  <img
                    src={coverUrl(game.cover_image_id)}
                    alt={game.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <PosterPlaceholder title={game.title} />
                )}
                {badgeColor && (
                  <div className={`absolute top-1.5 right-1.5 ${badgeColor} text-[10px] font-black px-1.5 py-0.5`}>
                    {pct}%
                  </div>
                )}
              </div>

              <p className="text-[13px] font-bold text-white leading-snug line-clamp-2 group-hover:text-white transition-colors">
                {game.title}
              </p>
              <p className="text-[12px] text-[#777777] mt-0.5">{total} {total === 1 ? 'review' : 'reviews'}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

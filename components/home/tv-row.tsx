import Link from 'next/link';
import { SectionHeading } from '@/components/ui/section-heading';
import { supabase } from '@/lib/supabase';
import { badgeClasses } from '@/lib/utils/score-tier';

interface TvRowProps {
  title: string;
  subtitle: string;
  endpoint: string;
  maxItems?: number;
}

async function fetchTmdbTv(endpoint: string) {
  const apiKey = process.env.TMDB_API_KEY;
  const data = await fetch(`https://api.themoviedb.org/3/${endpoint}&api_key=${apiKey}`, { next: { revalidate: 3600 } })
    .then(r => r.ok ? r.json() : null)
    .catch(() => null);
  return data?.results ?? [];
}

export async function TvRow({ title, subtitle, endpoint, maxItems = 7 }: TvRowProps) {
  const shows = await fetchTmdbTv(endpoint);
  if (!shows.length) return null;

  const showIds = shows.slice(0, maxItems).map((s: any) => s.id);

  const { data: reviews } = await supabase
    .from('reviews')
    .select('show_id, recommend')
    .in('show_id', showIds)
    .not('recommend', 'is', null);

  const MIN_REVIEWS = 4;
  const scoreMap = new Map<number, number>();
  const agg = new Map<number, { t: number; r: number }>();
  for (const r of reviews ?? []) {
    const e = agg.get(r.show_id) ?? { t: 0, r: 0 };
    e.t++;
    if (r.recommend) e.r++;
    agg.set(r.show_id, e);
  }
  agg.forEach((v, k) => {
    if (v.t >= MIN_REVIEWS) scoreMap.set(k, Math.round((v.r / v.t) * 100));
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        
        <SectionHeading label={subtitle} title={title} />
      </div>

      <div className="grid grid-cols-7 gap-x-3">
        {shows.slice(0, maxItems).map((show: any) => {
          const pct = scoreMap.get(show.id) ?? null;
          const badgeColor = pct !== null ? badgeClasses(pct) : null;

          return (
            <Link key={show.id} href={`/show/${show.id}`} className="group">
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#1E1E1E] shadow-sm group-hover:shadow-md transition-shadow">
                {show.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${show.poster_path}`}
                    alt={show.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#222222]">
                    <span className="text-[10px] font-bold text-[#777777] text-center px-2">{show.name}</span>
                  </div>
                )}
                {badgeColor && (
                  <div className={`absolute top-1.5 right-1.5 ${badgeColor} text-[10px] font-black px-1.5 py-0.5`}>
                    {pct}%
                  </div>
                )}
              </div>
              <p className="mt-2 text-[13px] font-bold text-white leading-tight line-clamp-2 group-hover:text-white transition-colors">
                {show.name}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

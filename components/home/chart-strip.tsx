import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { pillCls } from '@/lib/utils/score-tier';
import { SectionHeading } from '@/components/ui/section-heading';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChartItem {
  id: number;
  title: string;
  year: string;
  pct: number | null;
  href: string;
  posterPath?: string | null;
}

interface ChartColumn {
  heading: string;
  subheading: string;
  viewAllHref: string;
  items: ChartItem[];
}

// ── Data helpers ──────────────────────────────────────────────────────────────

async function fetchTmdb(endpoint: string): Promise<any[]> {
  const key = process.env.TMDB_API_KEY;
  const sep = endpoint.includes('?') ? '&' : '?';
  const data = await fetch(
    `https://api.themoviedb.org/3/${endpoint}${sep}api_key=${key}&language=en-US`,
    { next: { revalidate: 3600 } },
  ).then(r => r.ok ? r.json() : null).catch(() => null);
  return (data?.results ?? []).slice(0, 5);
}

const MIN_REVIEWS = 4;

async function getMovieScores(ids: number[]) {
  if (!ids.length) return new Map<number, number>();
  const { data } = await supabase
    .from('reviews')
    .select('movie_id, recommend')
    .in('movie_id', ids)
    .not('recommend', 'is', null);
  const agg = new Map<number, { t: number; r: number }>();
  for (const row of data ?? []) {
    const e = agg.get(row.movie_id) ?? { t: 0, r: 0 };
    e.t++; if (row.recommend) e.r++;
    agg.set(row.movie_id, e);
  }
  const out = new Map<number, number>();
  agg.forEach((v, k) => { if (v.t >= MIN_REVIEWS) out.set(k, Math.round((v.r / v.t) * 100)); });
  return out;
}

async function getShowScores(ids: number[]) {
  if (!ids.length) return new Map<number, number>();
  const { data } = await supabase
    .from('reviews')
    .select('show_id, recommend')
    .in('show_id', ids)
    .not('recommend', 'is', null);
  const agg = new Map<number, { t: number; r: number }>();
  for (const row of data ?? []) {
    const e = agg.get(row.show_id) ?? { t: 0, r: 0 };
    e.t++; if (row.recommend) e.r++;
    agg.set(row.show_id, e);
  }
  const out = new Map<number, number>();
  agg.forEach((v, k) => { if (v.t >= MIN_REVIEWS) out.set(k, Math.round((v.r / v.t) * 100)); });
  return out;
}

// ── Score badge ───────────────────────────────────────────────────────────────

function Score({ pct }: { pct: number | null }) {
  if (pct === null) return null; // No badge for unscored — cleaner than a placeholder
  return (
    <span className={`text-[10px] font-black tabular-nums rounded px-1.5 py-0.5 min-w-[38px] text-center inline-block ${pillCls(pct)}`}>
      {pct}%
    </span>
  );
}

// ── Single column ─────────────────────────────────────────────────────────────

function Column({ col }: { col: ChartColumn }) {
  return (
    <div className="flex-1 min-w-0">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-white/[0.07]">
        <SectionHeading
          label={col.subheading}
          title={col.heading}
          viewAllHref={col.viewAllHref}
          viewAllLabel="All"
        />
      </div>

      {/* Ranked list — bigger thumbnails, badge snapped to title */}
      <ol className="flex flex-col gap-0">
        {col.items.map((item, i) => (
          <li key={item.id}>
            <Link
              href={item.href as any}
              className="flex items-center gap-2.5 py-1 group border-b border-white/[0.06] last:border-0"
            >
              {/* Rank — bold typographic design element */}
              <span className={`tabular-nums text-center shrink-0 w-8 text-[28px] font-black leading-none tracking-tighter ${
                i === 0 ? 'text-white' : i === 1 ? 'text-white/50' : 'text-white/25'
              }`}>
                {i + 1}
              </span>

              {/* Poster thumbnail */}
              <div className="shrink-0 w-[36px] h-[54px] rounded-sm overflow-hidden bg-white/5 shadow-sm">
                {item.posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${item.posterPath}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/5" />
                )}
              </div>

              {/* Title + year + badge inline */}
              <span className="flex-1 min-w-0">
                <span className={`text-[12px] font-bold group-hover:text-white transition-colors leading-snug line-clamp-2 ${
                  i === 0 ? 'text-white' : 'text-white/75'
                }`}>
                  {item.title}
                </span>
                {(item.year || item.pct !== null) && (
                  <span className="flex items-center gap-2 mt-1 flex-wrap">
                    {item.year && (
                      <span className="text-[10px] text-white/30">{item.year}</span>
                    )}
                    {item.pct !== null && <Score pct={item.pct} />}
                  </span>
                )}
              </span>

            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Strip wrapper ─────────────────────────────────────────────────────────────

function Strip({ columns }: { columns: ChartColumn[] }) {
  return (
    <div className="w-full grid grid-cols-3 gap-x-10">
      {columns.map(col => (
        <Column key={col.heading} col={col} />
      ))}
    </div>
  );
}

// ── Movie chart strip ─────────────────────────────────────────────────────────

export async function MovieChartStrip() {
  const [inCinemas, comingSoon] = await Promise.all([
    fetchTmdb('movie/now_playing?region=GB'),
    fetchTmdb('movie/upcoming?region=GB'),
  ]);

  const allIds = [...inCinemas, ...comingSoon].map((m: any) => m.id);
  const scores = await getMovieScores(allIds);

  // Most reviewed movies
  const { data: reviewRows } = await supabase
    .from('reviews')
    .select('movie_id, recommend')
    .not('movie_id', 'is', null);

  const movieCountMap = new Map<number, { t: number; r: number }>();
  for (const row of (reviewRows ?? []) as any[]) {
    const e = movieCountMap.get(row.movie_id) ?? { t: 0, r: 0 };
    e.t++; if (row.recommend) e.r++;
    movieCountMap.set(row.movie_id, e);
  }

  const topMovieIds = Array.from(movieCountMap.entries())
    .sort((a, b) => b[1].t - a[1].t)
    .slice(0, 5)
    .map(([id]) => id);

  // movies table has no poster_path column — fetch title+year from DB,
  // poster from TMDB in parallel (5 targeted requests, fast)
  const [{ data: topMovieDetails }, ...tmdbPosters] = await Promise.all([
    supabase.from('movies').select('id, title, release_date').in('id', topMovieIds),
    ...topMovieIds.map(id =>
      fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}`, { next: { revalidate: 86400 } })
        .then(r => r.ok ? r.json() : null).catch(() => null)
        .then(d => ({ id, posterPath: d?.poster_path ?? null }))
    ),
  ]);

  const posterMap = new Map(tmdbPosters.map((p: any) => [p.id, p.posterPath]));
  const movieDetailMap = new Map((topMovieDetails ?? []).map((m: any) => [m.id, m]));

  const mostReviewed: ChartItem[] = topMovieIds
    .map(id => {
      const counts = movieCountMap.get(id)!;
      const detail = movieDetailMap.get(id) as any;
      if (!detail) return null;
      return {
        id,
        title: detail.title,
        year: (detail.release_date ?? '').substring(0, 4),
        pct: counts.t >= MIN_REVIEWS ? Math.round((counts.r / counts.t) * 100) : null,
        href: `/movie/${id}`,
        posterPath: posterMap.get(id) ?? null,
      };
    })
    .filter(Boolean) as ChartItem[];

  const toItem = (m: any): ChartItem => ({
    id: m.id,
    title: m.title,
    year: m.release_date?.substring(0, 4) ?? '',
    pct: scores.get(m.id) ?? null,
    href: `/movie/${m.id}`,
    posterPath: m.poster_path ?? null,
  });

  const columns: ChartColumn[] = [
    {
      heading: 'In Cinemas Now',
      subheading: 'On screens this week',
      viewAllHref: '/reviews?type=movie&sort=recent',
      items: inCinemas.slice(0, 5).map(toItem),
    },
    {
      heading: 'Most Reviewed',
      subheading: 'Biggest YouTube coverage',
      viewAllHref: '/reviews?type=movie&sort=count',
      items: mostReviewed,
    },
    {
      heading: 'Coming Soon',
      subheading: 'Upcoming releases',
      viewAllHref: '/reviews?type=movie',
      items: comingSoon.slice(0, 5).map(toItem),
    },
  ];

  return <Strip columns={columns} />;
}

// ── TV chart strip ────────────────────────────────────────────────────────────

export async function TvChartStrip() {
  const [trending, onAir] = await Promise.all([
    fetchTmdb('trending/tv/week'),
    fetchTmdb('tv/on_the_air?region=GB'),
  ]);

  const allIds = [...trending, ...onAir].map((s: any) => s.id);
  const scores = await getShowScores(allIds);

  const { data: showReviewRows } = await supabase
    .from('reviews')
    .select('show_id, recommend')
    .not('show_id', 'is', null);

  const showCountMap = new Map<number, { total: number; scored: number; recs: number }>();
  for (const row of (showReviewRows ?? []) as any[]) {
    const e = showCountMap.get(row.show_id) ?? { total: 0, scored: 0, recs: 0 };
    e.total++;
    if (row.recommend !== null) { e.scored++; if (row.recommend) e.recs++; }
    showCountMap.set(row.show_id, e);
  }

  const topShowIds = Array.from(showCountMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(([id]) => id);

  const { data: topShowDetails } = await supabase
    .from('shows')
    .select('id, title, poster_path')
    .in('id', topShowIds);

  const showDetailMap = new Map((topShowDetails ?? []).map((s: any) => [s.id, s]));

  const mostReviewedShows: ChartItem[] = topShowIds
    .map(id => {
      const counts = showCountMap.get(id)!;
      const detail = showDetailMap.get(id) as any;
      if (!detail) return null;
      return {
        id,
        title: detail.title,
        year: '',
        pct: counts.scored >= MIN_REVIEWS ? Math.round((counts.recs / counts.scored) * 100) : null,
        href: `/show/${id}`,
        posterPath: detail.poster_path ?? null,
      };
    })
    .filter(Boolean) as ChartItem[];

  const toItem = (s: any): ChartItem => ({
    id: s.id,
    title: s.name ?? s.title,
    year: (s.first_air_date ?? '').substring(0, 4),
    pct: scores.get(s.id) ?? null,
    href: `/show/${s.id}`,
    posterPath: s.poster_path ?? null,
  });

  const columns: ChartColumn[] = [
    {
      heading: 'Trending This Week',
      subheading: 'Hot right now',
      viewAllHref: '/reviews?type=tv&sort=recent',
      items: trending.slice(0, 5).map(toItem),
    },
    {
      heading: 'Most Reviewed',
      subheading: 'Biggest YouTube TV coverage',
      viewAllHref: '/reviews?type=tv&sort=count',
      items: mostReviewedShows,
    },
    {
      heading: 'New & Returning',
      subheading: 'Currently airing',
      viewAllHref: '/reviews?type=tv&sort=recent',
      items: onAir.slice(0, 5).map(toItem),
    },
  ];

  return <Strip columns={columns} />;
}

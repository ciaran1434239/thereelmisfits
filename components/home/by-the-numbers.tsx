import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { pillCls } from '@/lib/utils/score-tier';
import { AvatarImg } from '@/components/ui/avatar-img';
import { getCriticStandings } from '@/lib/data/critic-standings';
import { SmartTinyPoster } from '@/components/ui/smart-poster';

const TMDB = process.env.TMDB_API_KEY;
const MIN_REVIEWS = 4;  // match hero: show score once at least 4 critics have given a verdict

// ── Title case ───────────────────────────────────────────────────────────────
// Some movies are stored in the DB as ALL CAPS. Convert to title case for display.
const SMALL_WORDS = new Set(['a','an','the','and','but','or','for','nor','on','at','to','by','in','of','up','as','is','it']);
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word, i) => {
      if (!word) return word;
      // Always capitalise first/last word and words after colons
      if (i === 0 || !SMALL_WORDS.has(word)) return (word[0] ?? '').toUpperCase() + word.slice(1);
      return word;
    })
    .join(' ');
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(isoStr: string): string {
  const ms = Date.now() - new Date(isoStr).getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return 'JUST NOW';
  if (h < 24) return `${h}H AGO`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}D AGO`;
  return `${Math.floor(d / 30)}MO AGO`;
}

function fmtRevenue(n: number): string | null {
  if (!n || n < 500_000) return null;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  return `$${Math.round(n / 1_000_000)}M`;
}

// ── TMDB helper ───────────────────────────────────────────────────────────────

async function tmdb(path: string, init?: RequestInit) {
  const sep = path.includes('?') ? '&' : '?';
  const r = await fetch(
    `https://api.themoviedb.org/3/${path}${sep}api_key=${TMDB}&language=en-US`,
    init,
  ).catch(() => null);
  return r?.ok ? r.json() : null;
}

// ── Small shared sub-components ───────────────────────────────────────────────

function ColHeader({ title, href, cta = 'All →' }: { title: string; href: string; cta?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-3 pb-2.5 border-b-2 border-[#C8201F]">
      <span className="text-[0.65rem] font-[700] uppercase tracking-[0.12em] text-[#C8201F]">{title}</span>
      <Link
        href={href as any}
        className="text-[9px] font-black uppercase tracking-[0.12em] text-subtle hover:text-[#C8201F] transition-colors whitespace-nowrap ml-2"
      >
        {cta}
      </Link>
    </div>
  );
}

function RankNum({ n }: { n: number }) {
  return (
    <span className={`tabular-nums shrink-0 w-[22px] text-[22px] font-black leading-none tracking-tighter text-right ${n === 1 ? 'text-ink' : 'text-[#BBBBBB]'}`}>
      {n}
    </span>
  );
}

function Poster({ src, title }: { src: string | null; title: string }) {
  return (
    <div className="shrink-0 w-[43px] h-[64px] rounded-[4px] overflow-hidden bg-[#2A2A2A] shadow-sm">
      <SmartTinyPoster src={src} title={title} />
    </div>
  );
}

function Score({ pct }: { pct: number | null }) {
  if (pct === null) {
    return (
      <span className="text-[9px] font-black rounded px-1.5 py-0.5 min-w-[30px] text-center shrink-0 bg-white/10 text-white/40">
        –
      </span>
    );
  }
  return (
    <span className={`text-[9px] font-black tabular-nums rounded px-1.5 py-0.5 min-w-[30px] text-center shrink-0 ${pillCls(pct)}`}>
      {pct}%
    </span>
  );
}

// ── Row types ──────────────────────────────────────────────────────────────────

function FilmRow({ n, posterPath, title, year, pct, href }: {
  n: number; posterPath: string | null; title: string; year: string; pct: number | null; href: string;
}) {
  return (
    <li className={n === 1 ? 'border-l-2 border-[#C8201F]' : 'border-l-2 border-transparent'}>
      <Link
        href={href as any}
        className="flex items-center gap-2.5 py-3.5 border-b border-white/[0.07] last:border-0 group pl-1 hover:bg-white/[0.04] transition-colors"
      >
        <RankNum n={n} />
        <Poster src={posterPath} title={title} />
        <span className="flex-1 min-w-0">
          <span className={`text-[11px] font-semibold leading-tight line-clamp-2 group-hover:text-[#C8201F] transition-colors ${n === 1 ? 'text-ink' : 'text-body'}`}>
            {title}
          </span>
          {year && <span className="text-[9px] text-subtle mt-0.5 block">{year}</span>}
        </span>
        <Score pct={pct} />
      </Link>
    </li>
  );
}

function LatestFilmRow({ n, posterPath, title, postedAt, pct, href }: {
  n: number; posterPath: string | null; title: string; postedAt: string; pct: number | null; href: string;
}) {
  return (
    <li className={n === 1 ? 'border-l-2 border-[#C8201F]' : 'border-l-2 border-transparent'}>
      <Link
        href={href as any}
        className="flex items-center gap-2.5 py-3.5 border-b border-white/[0.07] last:border-0 group pl-1 hover:bg-white/[0.04] transition-colors"
      >
        <RankNum n={n} />
        <Poster src={posterPath} title={title} />
        <span className="flex-1 min-w-0">
          <span className={`text-[11px] font-semibold leading-tight line-clamp-2 group-hover:text-[#C8201F] transition-colors ${n === 1 ? 'text-ink' : 'text-body'}`}>
            {toTitleCase(title)}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wide text-subtle mt-0.5 block">
            {timeAgo(postedAt)}
          </span>
        </span>
        <Score pct={pct} />
      </Link>
    </li>
  );
}

function BoxOfficeRow({ n, posterPath, title, revenue, href }: {
  n: number; posterPath: string | null; title: string; revenue: number; href: string;
}) {
  const gross = fmtRevenue(revenue);
  return (
    <li className={n === 1 ? 'border-l-2 border-[#C8201F]' : 'border-l-2 border-transparent'}>
      <Link
        href={href as any}
        className="flex items-center gap-2.5 py-3.5 border-b border-white/[0.07] last:border-0 group pl-1 hover:bg-white/[0.04] transition-colors"
      >
        <RankNum n={n} />
        <Poster src={posterPath} title={title} />
        <span className="flex-1 min-w-0">
          <span className={`text-[11px] font-semibold leading-tight line-clamp-2 group-hover:text-[#C8201F] transition-colors ${n === 1 ? 'text-ink' : 'text-body'}`}>
            {title}
          </span>
        </span>
        {gross ? (
          <div className="flex flex-col items-end shrink-0 gap-[2px]">
            <span className="text-[7px] font-bold uppercase tracking-widest text-subtle">TOTAL GROSS</span>
            <span className="text-[13px] font-black tabular-nums text-ink">
              {gross}
            </span>
          </div>
        ) : (
          <span className="text-[11px] font-bold text-faint shrink-0">—</span>
        )}
      </Link>
    </li>
  );
}

function FormDots({ form }: { form: ('W' | 'L')[] }) {
  // Always 5 slots; left-pad with nulls (unplayed), oldest result on the left
  const played = form.slice(-5);
  const dots: (('W' | 'L') | null)[] = [
    ...Array(Math.max(0, 5 - played.length)).fill(null),
    ...played,
  ];
  return (
    <span className="flex items-center gap-[3px]">
      {dots.map((d, i) =>
        d === 'W' ? (
          <span key={i} className="w-[7px] h-[7px] rounded-full bg-[#4ADE80] shrink-0" />
        ) : d === 'L' ? (
          <span key={i} className="w-[7px] h-[7px] rounded-full bg-[#F87171] shrink-0" />
        ) : (
          <span key={i} className="w-[7px] h-[7px] rounded-full border border-white/[0.18] shrink-0" />
        )
      )}
    </span>
  );
}

function CriticRow({ n, standing }: { n: number; standing: any }) {
  const href = standing.creator?.handle
    ? `/channel/${standing.creator.handle}`
    : '/critics/league';
  const form: ('W' | 'L')[] = standing.form ?? [];
  return (
    <li className={n === 1 ? 'border-l-2 border-[#C8201F]' : 'border-l-2 border-transparent'}>
      <Link
        href={href as any}
        className="flex items-center gap-2 py-[17px] border-b border-white/[0.07] last:border-0 group pl-1 hover:bg-white/[0.04] transition-colors"
      >
        <RankNum n={n} />
        <AvatarImg
          src={standing.creator?.avatar_url}
          name={standing.creator?.name || '?'}
          className="w-6 h-6 shrink-0"
        />
        <span className="flex-1 min-w-0">
          <span className="text-[12px] font-semibold text-ink leading-tight truncate block group-hover:text-[#C8201F] transition-colors">
            {standing.creator?.name}
          </span>
          <span className="mt-0.5 block">
            <FormDots form={form} />
          </span>
        </span>
        <span className="text-[14px] font-black tabular-nums text-ink shrink-0 min-w-[38px] text-right">
          {standing.winPct}%
        </span>
      </Link>
    </li>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export async function ByTheNumbers() {
  // ── Phase 1: all parallel ────────────────────────────────────────────────────
  const [inCinemasData, { data: recentReviews }, rpcResult, standings] = await Promise.all([
    tmdb('movie/now_playing?region=GB', { cache: 'no-store' }),
    supabase
      .from('reviews')
      .select('movie_id, posted_at, movies(id, title)')
      .not('movie_id', 'is', null)
      .order('posted_at', { ascending: false })
      .limit(300),   // large pool so we can find 5 scored movies
    // Server-side aggregate — immune to row-count caps; returns one row per movie.
    // Falls back to raw rows if the SQL function hasn't been created yet.
    (supabase.rpc('movie_score_stats') as any),
    getCriticStandings(),
  ]);

  // Build score map — use RPC result if available, otherwise raw row fallback
  const stats = new Map<number, { t: number; r: number }>();

  if (rpcResult?.data?.length) {
    // RPC path: server-aggregated, no row-cap risk
    for (const row of rpcResult.data as any[]) {
      stats.set(Number(row.movie_id), { t: Number(row.total_reviews), r: Number(row.recommended) });
    }
  } else {
    // Fallback: fetch raw rows until RPC is deployed (run movie_score_stats SQL in Supabase)
    const { data: reviewRows } = await supabase
      .from('reviews')
      .select('movie_id, recommend')
      .not('movie_id', 'is', null)
      .limit(10000);
    for (const row of reviewRows ?? []) {
      if (row.recommend === null) continue; // only count scored reviews, matching hero
      const e = stats.get(row.movie_id) ?? { t: 0, r: 0 };
      e.t++;
      if (row.recommend) e.r++;
      stats.set(row.movie_id, e);
    }
  }

  const score = (id: number): number | null => {
    const s = stats.get(id);
    return s && s.t >= MIN_REVIEWS ? Math.round((s.r / s.t) * 100) : null;
  };

  // ── Column 1: In Cinemas Now ─────────────────────────────────────────────────
  const inCinemas = ((inCinemasData?.results ?? []) as any[])
    .filter(m => m.poster_path && m.original_language === 'en')
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 5)
    .map(m => ({
      id:         m.id as number,
      title:      m.title as string,
      posterPath: m.poster_path as string,
      year:       (m.release_date ?? '').slice(0, 4) as string,
      pct:        score(m.id),
    }));

  // ── Column 2: Latest Reviews — 5 most recently reviewed movies that have a score ─
  // score() requires MIN_REVIEWS reviews with a recommend value; unscored films are skipped.
  const latestByMovie = new Map<number, { title: string; postedAt: string }>();
  for (const r of (recentReviews ?? []) as any[]) {
    const m = Array.isArray(r.movies) ? r.movies[0] : r.movies;
    if (!m?.id || latestByMovie.has(m.id)) continue;
    if (score(m.id) === null) continue;           // skip unscored movies
    latestByMovie.set(m.id, { title: m.title ?? '', postedAt: r.posted_at ?? '' });
    if (latestByMovie.size >= 5) break;
  }
  const latestMovieIds = [...latestByMovie.keys()];

  // ── Column 3: Box Office — now_playing pool, ranked by total revenue ──────────
  const boxOfficePool = ((inCinemasData?.results ?? []) as any[])
    .filter(m => m.poster_path)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 12)
    .map((m: any) => m.id as number);

  // ── Phase 2: TMDB detail calls (all parallel) ────────────────────────────────
  const [latestPosterResults, boxOfficeDetailResults] = await Promise.all([
    // Posters for Latest Reviews movies
    Promise.all(
      latestMovieIds.map(id =>
        tmdb(`movie/${id}`, { next: { revalidate: 86400 } } as any)
          .then((d: any) => ({ id, posterPath: (d?.poster_path ?? null) as string | null }))
      )
    ),
    // Revenue + poster for Box Office movies
    Promise.all(
      boxOfficePool.map(id =>
        tmdb(`movie/${id}`, { next: { revalidate: 3600 } } as any)
          .then((d: any) => ({
            id,
            title:      (d?.title ?? '') as string,
            revenue:    (d?.revenue ?? 0) as number,
            posterPath: (d?.poster_path ?? null) as string | null,
          }))
      )
    ),
  ]);

  // Build Latest Reviews array
  const latestPosterMap = new Map(latestPosterResults.map(p => [p.id, p.posterPath]));
  const latestReviews = latestMovieIds
    .map(id => {
      const info = latestByMovie.get(id)!;
      return {
        id,
        title:      info.title,
        posterPath: latestPosterMap.get(id) ?? null,
        postedAt:   info.postedAt,
        pct:        score(id),
      };
    })
    .filter(m => m.title);

  // Build Box Office array — sort by revenue desc
  const boxOffice = [...boxOfficeDetailResults]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const top8Critics = standings.slice(0, 8);

  return (
    <section className="w-full py-10 px-4 sm:px-6">
      <div className="max-w-[1060px] mx-auto">

        {/* ── Section header ────────────────────────────────────── */}
        <div className="mb-10">
          <p className="text-[0.65rem] font-[700] uppercase tracking-[0.12em] text-[#C8201F] mb-1.5">
            Stats, Rankings &amp; Data
          </p>
          <h2 className="text-[1.6rem] sm:text-[2rem] font-black text-white tracking-tight leading-none uppercase">
            By the Numbers
          </h2>
        </div>

        {/* ── Four equal columns ─────────────────────────────────────────────── */}
        {/* Strategy: headers live in their own grid row (no dividers through them). */}
        {/* The content rows sit in a separate relative wrapper so the 2px red      */}
        {/* dividers start exactly at the first data row and end at the last.        */}

        {/* Pre-build each column's list so JSX isn't duplicated between            */}
        {/* the mobile layout (headers+content together) and the desktop layout.    */}
        {(() => {
          const col1List = (
            <ol className="flex flex-col">
              {inCinemas.map((m, i) => <FilmRow key={m.id} n={i + 1} href={`/movie/${m.id}`} {...m} />)}
              {inCinemas.length === 0 && <li className="text-[11px] text-subtle pt-4">No listings available</li>}
            </ol>
          );
          const col2List = (
            <ol className="flex flex-col">
              {latestReviews.map((m, i) => <LatestFilmRow key={m.id} n={i + 1} href={`/movie/${m.id}`} {...m} />)}
              {latestReviews.length === 0 && <li className="text-[11px] text-subtle pt-4">No recent reviews</li>}
            </ol>
          );
          const col3List = (
            <ol className="flex flex-col">
              {boxOffice.map((m, i) => <BoxOfficeRow key={m.id} n={i + 1} href={`/movie/${m.id}`} {...m} />)}
              {boxOffice.length === 0 && <li className="text-[11px] text-subtle pt-4">No data available</li>}
            </ol>
          );
          const col4List = top8Critics.length === 0
            ? <li className="text-[11px] text-subtle pt-4">No rankings yet</li>
            : <ol className="flex flex-col">{top8Critics.map((s: any, i: number) => <CriticRow key={s.creator?.id ?? i} n={i + 1} standing={s} />)}</ol>;

          return (
            <>
              {/* ── MOBILE (< lg): headers + content in the same column div ─ */}
              <div className="grid grid-cols-2 gap-y-10 lg:hidden">
                <div className="px-4 min-w-0 border-r border-[#C8201F]/20">
                  <ColHeader title="In Cinemas Now" href="/reviews?type=movie&sort=recent" />
                  {col1List}
                </div>
                <div className="px-4 min-w-0">
                  <ColHeader title="Latest Reviews" href="/reviews?type=movie&sort=recent" />
                  {col2List}
                </div>
                <div className="px-4 min-w-0 border-r border-[#C8201F]/20">
                  <ColHeader title="Box Office" href="/reviews?type=movie" cta="Rankings →" />
                  {col3List}
                </div>
                <div className="px-4 min-w-0">
                  <ColHeader title="Leaderboard" href="/critics/league" cta="Full table →" />
                  {col4List}
                </div>
              </div>

              {/* ── DESKTOP (≥ lg): headers in own row, content in own row ── */}
              <div className="hidden lg:block">

                {/* Row A: column headers — no dividers pass through here */}
                <div className="grid grid-cols-4">
                  <div className="px-4 min-w-0"><ColHeader title="In Cinemas Now" href="/reviews?type=movie&sort=recent" /></div>
                  <div className="px-4 min-w-0"><ColHeader title="Latest Reviews" href="/reviews?type=movie&sort=recent" /></div>
                  <div className="px-4 min-w-0"><ColHeader title="Box Office" href="/reviews?type=movie" cta="Rankings →" /></div>
                  <div className="px-4 min-w-0"><ColHeader title="Leaderboard" href="/critics/league" cta="Full table →" /></div>
                </div>

                {/* Row B: content rows — 2px #C8201F dividers span exactly this block */}
                <div className="relative">
                  <div className="flex absolute inset-0 pointer-events-none" aria-hidden>
                    <div className="flex-1" />
                    <div className="w-[2px] bg-white/[0.07]" />
                    <div className="flex-1" />
                    <div className="w-[2px] bg-white/[0.07]" />
                    <div className="flex-1" />
                    <div className="w-[2px] bg-white/[0.07]" />
                    <div className="flex-1" />
                  </div>
                  <div className="grid grid-cols-4">
                    <div className="px-4 min-w-0">{col1List}</div>
                    <div className="px-4 min-w-0">{col2List}</div>
                    <div className="px-4 min-w-0">{col3List}</div>
                    <div className="px-4 min-w-0">{col4List}</div>
                  </div>
                </div>

              </div>
            </>
          );
        })()}
      </div>
    </section>
  );
}

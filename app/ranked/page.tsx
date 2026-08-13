export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AvatarImg } from '@/components/ui/avatar-img';
import { getCriticStandings } from '@/lib/data/critic-standings';
import { pillCls } from '@/lib/utils/score-tier';

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Returns the Monday (00:00) and Sunday (23:59:59) of the current week. */
function getCurrentWeekBounds(): { monday: Date; sunday: Date } {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun … 6=Sat
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function fmtDay(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function fmtGross(n: number): string {
  if (!n) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  return `$${Math.round(n / 1_000_000)}M`;
}

// ── Weekly chart ──────────────────────────────────────────────────────────────

interface ChartEntry {
  id: number;
  title: string;
  poster_path: string | null;
  reviewCount: number;
  scoredCount: number;
  recCount: number;
  pct: number | null;
  creators: { name: string; avatar_url: string | null }[];
  href: string;
}

async function getWeeklyChart(type: 'movie' | 'tv'): Promise<ChartEntry[]> {
  const { monday, sunday } = getCurrentWeekBounds();
  const col = type === 'movie' ? 'movie_id' : 'show_id';
  const table = type === 'movie' ? 'movies' : 'shows';

  const { data } = await supabase
    .from('reviews')
    .select(`${col}, recommend, ${table}(id, title, poster_path), creators(name, avatar_url)`)
    .not(col, 'is', null)
    .gte('posted_at', monday.toISOString())
    .lte('posted_at', sunday.toISOString())
    .order('posted_at', { ascending: false });

  if (!data?.length) return [];

  const map = new Map<number, ChartEntry>();
  for (const row of data as any[]) {
    const content = Array.isArray(row[table]) ? row[table][0] : row[table];
    if (!content) continue;
    const id = content.id as number;
    const e = map.get(id) ?? {
      id,
      title: content.title as string,
      poster_path: (content.poster_path ?? null) as string | null,
      reviewCount: 0,
      scoredCount: 0,
      recCount: 0,
      pct: null,
      creators: [] as { name: string; avatar_url: string | null }[],
      href: type === 'movie' ? `/movie/${id}` : `/show/${id}`,
    };
    e.reviewCount++;
    if (row.recommend !== null) { e.scoredCount++; if (row.recommend) e.recCount++; }
    const creator = Array.isArray(row.creators) ? row.creators[0] : row.creators;
    if (creator && !e.creators.find((c: any) => c.name === creator.name)) {
      e.creators.push({ name: creator.name, avatar_url: creator.avatar_url });
    }
    map.set(id, e);
  }

  return Array.from(map.values())
    .map(e => ({ ...e, pct: e.scoredCount < 4 ? null : Math.round((e.recCount / e.scoredCount) * 100) }))
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 10);
}

// ── Box office panel data ─────────────────────────────────────────────────────

async function getBoxOfficeTop3() {
  const { data: latest } = await supabase
    .from('box_office')
    .select('week_of')
    .order('week_of', { ascending: false })
    .limit(1)
    .single();

  if (!latest?.week_of) return [];

  const { data } = await supabase
    .from('box_office')
    .select('rank, title, weekend_gross, movie_id')
    .eq('week_of', latest.week_of)
    .eq('region', 'domestic')
    .order('rank')
    .limit(3);

  if (!data?.length) return [];

  // Fetch poster paths for matched movies
  const movieIds = (data as any[]).filter(r => r.movie_id).map(r => r.movie_id);
  const { data: movies } = movieIds.length
    ? await supabase.from('movies').select('id, poster_path').in('id', movieIds)
    : { data: [] };

  const posterMap = new Map((movies ?? []).map((m: any) => [m.id, m.poster_path]));

  return (data as any[]).map(r => ({
    rank: r.rank as number,
    title: r.title as string,
    weekend_gross: r.weekend_gross as number,
    poster_path: r.movie_id ? (posterMap.get(r.movie_id) ?? null) : null,
    movie_id: r.movie_id ?? null,
  }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreBar({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-[10px] font-bold text-white/20">—</span>;
  const color = pct >= 75 ? 'bg-[#2BA640]' : pct >= 50 ? 'bg-[#D97706]' : 'bg-[#E21D1D]';
  const label = pct >= 75 ? 'text-[#4ADE80]' : pct >= 50 ? 'text-[#D97706]' : 'text-[#F87171]';
  return (
    <div className="flex items-center gap-2 w-full max-w-[160px]">
      <div className="flex-1 h-[3px] bg-white/[0.08] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[11px] font-black tabular-nums shrink-0 ${label}`}>{pct}%</span>
    </div>
  );
}

function ChartRow({ entry, rank }: { entry: ChartEntry; rank: number }) {
  return (
    <Link
      href={entry.href as any}
      className="group flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03] -mx-3 px-3 rounded transition-colors"
    >
      {/* Rank */}
      <span className={`shrink-0 w-6 text-right tabular-nums font-black leading-none ${
        rank === 1 ? 'text-[18px] text-white' : rank <= 3 ? 'text-[16px] text-white/70' : 'text-[14px] text-white/30'
      }`}>
        {rank}
      </span>

      {/* Poster */}
      <div className="shrink-0 w-8 h-12 rounded-[3px] overflow-hidden bg-white/[0.05]">
        {entry.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w92${entry.poster_path}`}
            alt={entry.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-white/[0.04]" />
        )}
      </div>

      {/* Title + score */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold leading-tight truncate mb-1 group-hover:text-white transition-colors ${
          rank <= 3 ? 'text-[12px] text-white' : 'text-[12px] text-white/60'
        }`}>
          {entry.title}
        </p>
        <ScoreBar pct={entry.pct} />
      </div>

      {/* Avatars + count */}
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <div className="flex -space-x-1.5">
          {entry.creators.slice(0, 3).map((c, i) => (
            <div key={i} className="w-5 h-5 rounded-full border border-[#111111] overflow-hidden bg-white/[0.08]">
              <AvatarImg src={c.avatar_url} name={c.name} className="w-full h-full" />
            </div>
          ))}
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-white/25">
          {entry.reviewCount}
        </span>
      </div>
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#C8201F] mb-1">
      {children}
    </p>
  );
}

function ColHeader({ label, title, href, cta }: { label: string; title: string; href: string; cta: string }) {
  return (
    <div className="flex items-end justify-between mb-4 pb-3 border-b border-white/[0.06]">
      <div>
        <SectionLabel>{label}</SectionLabel>
        <h2 className="text-[20px] font-black text-white tracking-tight leading-none">{title}</h2>
      </div>
      <Link href={href as any} className="text-[9px] font-black uppercase tracking-[0.15em] text-white/25 hover:text-[#C8201F] transition-colors shrink-0 ml-4">
        {cta}
      </Link>
    </div>
  );
}

// ── Panel card ────────────────────────────────────────────────────────────────

function Panel({
  label, title, href, cta, children,
}: {
  label: string; title: string; href: string; cta: string; children: React.ReactNode;
}) {
  return (
    <Link
      href={href as any}
      className="group flex flex-col bg-[#1a1a1a] hover:bg-[#222222] transition-colors rounded-xl overflow-hidden cursor-pointer"
      style={{ borderLeft: '3px solid #C8201F' }}
    >
      <div className="flex-1 p-5">
        <div className="flex items-end justify-between mb-4">
          <div>
            <SectionLabel>{label}</SectionLabel>
            <h3 className="text-[16px] font-black text-white tracking-tight leading-none">{title}</h3>
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/20 group-hover:text-[#C8201F] transition-colors shrink-0 ml-4">
            {cta}
          </span>
        </div>
        {children}
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RankedPage() {
  const { monday, sunday } = getCurrentWeekBounds();

  const [movies, tv, standings, boxOfficeTop3] = await Promise.all([
    getWeeklyChart('movie'),
    getWeeklyChart('tv'),
    getCriticStandings(),
    getBoxOfficeTop3(),
  ]);

  const top3Critics = standings.slice(0, 3);
  const weekLabel = `${fmtDay(monday)} – ${fmtDay(sunday)}`;

  return (
    <div className="min-h-screen">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 py-10">

        {/* ── Page header ───────────────────────────────────────────── */}
        <div className="mb-10 pb-6 border-b border-white/[0.06]">
          <SectionLabel>Live Rankings</SectionLabel>
          <h1 className="text-[clamp(3rem,8vw,5.5rem)] font-[950] uppercase tracking-[-0.04em] leading-none text-white mb-3">
            RANKED
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
            {weekLabel} · Ranked by YouTube critic coverage
          </p>
        </div>

        {/* ── Section 1: Weekly charts ──────────────────────────────── */}
        <div className="mb-12">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-6">
            This week's charts
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">

            {/* Movies */}
            <section>
              <ColHeader
                label="Most reviewed this week"
                title="Movies"
                href="/reviews?type=movie&sort=recent"
                cta="All reviews →"
              />
              {movies.length === 0 ? (
                <p className="text-[11px] text-white/20 font-bold uppercase tracking-widest py-8 text-center">
                  No movie reviews this week yet
                </p>
              ) : (
                <div>
                  {movies.map((entry, i) => (
                    <ChartRow key={entry.id} entry={entry} rank={i + 1} />
                  ))}
                </div>
              )}
            </section>

            {/* TV Shows */}
            <section>
              <ColHeader
                label="Most reviewed this week"
                title="TV Shows"
                href="/reviews?type=tv&sort=recent"
                cta="All reviews →"
              />
              {tv.length === 0 ? (
                <p className="text-[11px] text-white/20 font-bold uppercase tracking-widest py-8 text-center">
                  No TV reviews this week yet
                </p>
              ) : (
                <div>
                  {tv.map((entry, i) => (
                    <ChartRow key={entry.id} entry={entry} rank={i + 1} />
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>

        {/* ── Section 2: Four panels ────────────────────────────────── */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-6">
            More rankings
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Panel 1 — Leaderboard */}
            <Panel label="Critics" title="Leaderboard" href="/ranked/leaderboard" cta="Full table →">
              {top3Critics.length === 0 ? (
                <p className="text-[11px] text-white/20 font-bold">No matchup data yet</p>
              ) : (
                <div className="flex flex-col gap-0">
                  {top3Critics.map((s, i) => (
                    <div key={s.creatorId} className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
                      <span className={`shrink-0 w-5 text-right tabular-nums font-black text-[13px] ${i === 0 ? 'text-white' : 'text-white/30'}`}>{i + 1}</span>
                      <AvatarImg src={s.creator.avatar_url} name={s.creator.name} className="w-6 h-6 shrink-0" />
                      <span className="flex-1 min-w-0 text-[11px] font-semibold text-white/70 truncate">{s.creator.name}</span>
                      <span className="text-[16px] font-black tabular-nums text-white shrink-0">{s.winPct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* Panel 2 — Box Office */}
            <Panel label="Box office" title="Weekend Gross" href="/ranked/box-office" cta="Full rankings →">
              {boxOfficeTop3.length === 0 ? (
                <p className="text-[11px] text-white/20 font-bold">No box office data yet</p>
              ) : (
                <div className="flex flex-col gap-0">
                  {boxOfficeTop3.map((row, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
                      <span className={`shrink-0 w-5 text-right tabular-nums font-black text-[13px] ${i === 0 ? 'text-white' : 'text-white/30'}`}>{row.rank}</span>
                      <div className="shrink-0 w-7 h-10 rounded-[3px] overflow-hidden bg-white/[0.05]">
                        {row.poster_path ? (
                          <img src={`https://image.tmdb.org/t/p/w92${row.poster_path}`} alt={row.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full" />
                        )}
                      </div>
                      <span className="flex-1 min-w-0 text-[11px] font-semibold text-white/70 truncate">{row.title}</span>
                      <div className="shrink-0 text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/25">WK GROSS</p>
                        <p className="text-[14px] font-black tabular-nums text-white/80">{fmtGross(row.weekend_gross)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* Panel 3 — The Lists */}
            <Panel label="Editorial" title="The Lists" href="/ranked/lists" cta="All lists →">
              <div className="flex flex-col gap-0">
                {[
                  { title: 'Best Tom Cruise Movies', count: 10, date: '5 Jun' },
                  { title: 'Top 10 Sci-Fi Films of the Decade', count: 10, date: '28 May' },
                  { title: 'Directors to Watch in 2026', count: 8, date: '20 May' },
                ].map((list, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0 gap-3">
                    <span className="text-[11px] font-semibold text-white/70 leading-tight line-clamp-1 flex-1 min-w-0">{list.title}</span>
                    <span className="shrink-0 text-[9px] font-bold text-white/25 whitespace-nowrap">{list.count} films · {list.date}</span>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Panel 4 — Polls */}
            <Panel label="Community" title="Polls" href="/ranked/polls" cta="All polls →">
              {/* Active poll placeholder */}
              <div>
                <p className="text-[11px] font-bold text-white/70 mb-3 leading-snug">
                  Who gave the better take on Masters of the Universe?
                </p>
                <div className="flex flex-col gap-2 mb-3">
                  {[
                    { label: 'Chris Stuckmann', pct: 62, color: 'bg-[#C8201F]' },
                    { label: 'Jeremy Jahns', pct: 38, color: 'bg-white/20' },
                  ].map((opt) => (
                    <div key={opt.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] font-bold text-white/50">{opt.label}</span>
                        <span className="text-[10px] font-black text-white/70">{opt.pct}%</span>
                      </div>
                      <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${opt.color}`} style={{ width: `${opt.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">247 votes</p>
              </div>
            </Panel>

          </div>
        </div>

      </div>
    </div>
  );
}

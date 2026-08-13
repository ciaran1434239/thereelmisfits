export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getCriticStandings } from '@/lib/data/critic-standings';
import { AvatarImg } from '@/components/ui/avatar-img';

type SortKey = 'winPct' | 'wins' | 'votes' | 'losses';

const SORT_LABELS: Record<SortKey, string> = {
  winPct:  'Win %',
  wins:    'Wins',
  losses:  'Losses',
  votes:   'Votes',
};

interface PageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function CriticLeaguePage({ searchParams }: PageProps) {
  const { sort = 'winPct' } = await searchParams;
  const validSort = (['winPct', 'wins', 'losses', 'votes'] as SortKey[]).includes(sort as SortKey)
    ? (sort as SortKey)
    : 'winPct';

  const allStandings = await getCriticStandings();

  const sorted = [...allStandings].sort((a, b) => {
    if (validSort === 'wins')   return b.wins - a.wins || b.winPct - a.winPct;
    if (validSort === 'losses') return b.losses - a.losses;
    if (validSort === 'votes')  return b.totalVotes - a.totalVotes;
    // default: winPct
    return b.winPct - a.winPct || b.wins - a.wins;
  });

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF4040] mb-1.5">
          Battle of the Critics
        </p>
        <h1 className="text-[32px] sm:text-[40px] font-black text-white leading-none tracking-tight">
          Critic Standings
        </h1>
        <p className="mt-2 text-[14px] text-white/40">
          Win / loss record from audience votes on Battle of the Critics matchups.
        </p>
      </div>

      {allStandings.length === 0 ? (
        <div className="rounded-xl bg-[#181818] border border-white/[0.06] p-10 text-center">
          <p className="text-white/30 text-[14px]">
            No matchups resolved yet — check back once votes come in.
          </p>
        </div>
      ) : (
        <>
          {/* Sort controls */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 mr-1">Sort by</span>
            {(['winPct', 'wins', 'losses', 'votes'] as SortKey[]).map(key => (
              <Link
                key={key}
                href={`/critics/league?sort=${key}`}
                className={[
                  'px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-[0.12em] border transition-colors',
                  validSort === key
                    ? 'bg-[#FF4040] border-[#FF4040] text-white'
                    : 'border-white/[0.1] bg-white/[0.04] text-white/50 hover:border-white/25 hover:text-white/80',
                ].join(' ')}
              >
                {SORT_LABELS[key]}
              </Link>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-xl bg-[#181818] border border-white/[0.06] overflow-hidden">

            {/* Header row */}
            <div className="hidden sm:grid grid-cols-[36px_1fr_52px_52px_64px_100px_64px] gap-3 items-center px-5 py-3 border-b border-white/[0.06]">
              {['#', 'Critic', 'W', 'L', 'Win%', 'Form', 'Votes'].map((h, i) => (
                <span
                  key={h}
                  className={[
                    'text-[9px] font-black uppercase tracking-[0.25em] text-white/25',
                    i >= 2 ? 'text-center' : '',
                    i === 4 ? 'text-center' : '',
                    i === 6 ? 'text-right' : '',
                  ].join(' ')}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Data rows */}
            {sorted.map((s, i) => {
              const rank = i + 1;
              const rankColour =
                rank === 1 ? 'text-[#FFD700]' :
                rank === 2 ? 'text-[#C0C0C0]' :
                rank === 3 ? 'text-[#CD7F32]' :
                'text-white/25';

              return (
                <div
                  key={s.creatorId}
                  className="grid sm:grid-cols-[36px_1fr_52px_52px_64px_100px_64px] grid-cols-[32px_1fr_auto] gap-3 items-center px-5 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors"
                >
                  {/* Rank */}
                  <span className={`text-[14px] font-black tabular-nums ${rankColour}`}>{rank}</span>

                  {/* Avatar + Name + handle */}
                  <Link
                    href={s.creator.handle ? `/channel/${s.creator.handle}` as any : '#'}
                    className="flex items-center gap-3 min-w-0 group"
                  >
                    <AvatarImg
                      src={s.creator.avatar_url}
                      name={s.creator.name}
                      className="w-9 h-9 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-black text-white truncate group-hover:text-[#FF4040] transition-colors">
                        {s.creator.name}
                      </p>
                      {s.creator.handle && (
                        <p className="text-[10px] text-white/30 truncate">@{s.creator.handle}</p>
                      )}
                    </div>
                  </Link>

                  {/* W */}
                  <span className="text-[15px] font-black tabular-nums text-[#4ADE80] text-center hidden sm:block">
                    {s.wins}
                  </span>

                  {/* L */}
                  <span className="text-[15px] font-black tabular-nums text-[#F87171] text-center hidden sm:block">
                    {s.losses}
                  </span>

                  {/* Win% */}
                  <span className="text-[15px] font-black tabular-nums text-white text-center hidden sm:block">
                    {s.winPct}%
                  </span>

                  {/* Form dots */}
                  <div className="hidden sm:flex items-center justify-center gap-1">
                    {s.form.length === 0 ? (
                      <span className="text-[10px] text-white/20">—</span>
                    ) : (
                      s.form.map((result, fi) => (
                        <span
                          key={fi}
                          title={result === 'W' ? 'Win' : 'Loss'}
                          className={[
                            'w-[10px] h-[10px] rounded-full inline-block',
                            result === 'W' ? 'bg-[#4ADE80]' : 'bg-[#F87171]',
                          ].join(' ')}
                        />
                      ))
                    )}
                    {/* Pad to 5 with empty spots */}
                    {Array.from({ length: Math.max(0, 5 - s.form.length) }).map((_, fi) => (
                      <span key={`pad-${fi}`} className="w-[10px] h-[10px] rounded-full bg-white/[0.08] inline-block" />
                    ))}
                  </div>

                  {/* Total votes */}
                  <span className="text-[13px] tabular-nums text-white/40 text-right hidden sm:block">
                    {s.totalVotes.toLocaleString()}
                  </span>

                  {/* Mobile: compact W/L/% in one cell */}
                  <div className="sm:hidden flex flex-col items-end gap-0.5">
                    <span className="text-[12px] font-black text-white">{s.winPct}%</span>
                    <span className="text-[10px] text-white/30">
                      <span className="text-[#4ADE80]">{s.wins}W</span>
                      {' '}
                      <span className="text-[#F87171]">{s.losses}L</span>
                    </span>
                  </div>
                </div>
              );
            })}

          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-[10px] h-[10px] rounded-full bg-[#4ADE80] inline-block" />
              <span className="text-[10px] text-white/30 uppercase tracking-[0.15em]">Win</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-[10px] h-[10px] rounded-full bg-[#F87171] inline-block" />
              <span className="text-[10px] text-white/30 uppercase tracking-[0.15em]">Loss</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-[10px] h-[10px] rounded-full bg-white/[0.08] inline-block" />
              <span className="text-[10px] text-white/30 uppercase tracking-[0.15em]">Not played</span>
            </div>
            <span className="ml-auto text-[10px] text-white/20">Form = last 5 matchups</span>
          </div>
        </>
      )}

    </div>
  );
}

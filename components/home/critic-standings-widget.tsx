import Link from 'next/link';
import { getCriticStandings } from '@/lib/data/critic-standings';
import { AvatarImg } from '@/components/ui/avatar-img';
import { SectionHeading } from '@/components/ui/section-heading';

export async function CriticStandingsWidget() {
  const standings = await getCriticStandings();

  // Widget only shows when there are at least 2 critics with results
  if (standings.length < 2) return null;

  const top5 = standings.slice(0, 5);

  return (
    <section className="w-full">
      <SectionHeading
        label="League table"
        title="Critic Standings"
        viewAllHref="/critics/league"
        viewAllLabel="Full table"
      />

      <div className="rounded-xl bg-[#181818] border border-white/[0.06] overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[28px_1fr_36px_36px_52px] gap-2 items-center px-4 py-2 border-b border-white/[0.05]">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">#</span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">Critic</span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 text-center">W</span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 text-center">L</span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 text-right">Win%</span>
        </div>

        {/* Rows */}
        {top5.map((s, i) => (
          <Link
            key={s.creatorId}
            href={s.creator.handle ? `/channel/${s.creator.handle}` as any : '/critics/league'}
            className="grid grid-cols-[28px_1fr_36px_36px_52px] gap-2 items-center px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors"
          >
            {/* Rank */}
            <span className="text-[12px] font-black tabular-nums text-white/30">{i + 1}</span>

            {/* Avatar + Name */}
            <div className="flex items-center gap-2.5 min-w-0">
              <AvatarImg
                src={s.creator.avatar_url}
                name={s.creator.name}
                className="w-7 h-7 shrink-0"
              />
              <span className="text-[12px] font-bold text-white truncate">{s.creator.name}</span>
            </div>

            {/* W */}
            <span className="text-[13px] font-black tabular-nums text-[#4ADE80] text-center">{s.wins}</span>

            {/* L */}
            <span className="text-[13px] font-black tabular-nums text-[#F87171] text-center">{s.losses}</span>

            {/* Win% */}
            <span className="text-[13px] font-black tabular-nums text-white text-right">{s.winPct}%</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

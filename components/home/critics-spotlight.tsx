import Link from 'next/link';
import { AvatarImg } from '@/components/ui/avatar-img';
import { SectionHeading } from '@/components/ui/section-heading';
import { VerdictVoteStrip } from './verdict-vote-strip';
import { getBattleOfCriticsPairs } from '@/lib/data/battle-of-critics';

export async function CriticsSpotlight() {
  const enriched = await getBattleOfCriticsPairs();
  if (!enriched.length) return null;

  return (
    <section className="w-full">
      <SectionHeading
        label="Critics couldn't agree"
        title="Battle of the Critics"
        viewAllHref="/critics/league"
        viewAllLabel="Leaderboard"
        dark
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
        {enriched.map(({ movieId, movieTitle, proPercent, conPercent, pro, con, posterPath }) => (
          <div key={movieId} className="relative overflow-hidden bg-[#181818] border border-[#2A2825] flex flex-col">

            {/* Poster bleeds through scrim at ~50% effective opacity */}
            {posterPath && (
              <img
                src={`https://image.tmdb.org/t/p/w780${posterPath}`}
                alt={movieTitle}
                className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none select-none"
              />
            )}
            <div className="absolute inset-0 bg-black/50 pointer-events-none" />

            {/* All foreground content in one stacking layer */}
            <div className="relative z-10 flex flex-col flex-1">

              {/* Film title */}
              <div className="flex justify-center pt-5 pb-1 px-6">
                <p className="text-[14px] font-black uppercase tracking-[0.07em] text-white text-center leading-tight line-clamp-1">
                  {movieTitle}
                </p>
              </div>

              {/* Two-critic split — flex-1 so it grows to fill available height */}
              <div className="relative grid grid-cols-2 flex-1">
                <div className="absolute inset-y-4 left-1/2 w-px bg-white/20 pointer-events-none" />

                {/* LEFT — recommends */}
                <Link
                  href={pro.creators?.handle ? `/channel/${pro.creators.handle}` as any : '#'}
                  className="p-5 flex flex-col gap-3 hover:bg-white/[0.04] transition-colors"
                >
                  <div>
                    <p className="text-[40px] font-black leading-none text-[#4ADE80] tabular-nums">{proPercent}%</p>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-0.5">of critics</p>
                  </div>
                  <div className="self-start px-2.5 py-1 bg-[#4ADE80]/15 border border-[#4ADE80]/20">
                    <span className="text-[9px] font-black tracking-[0.2em] uppercase text-[#4ADE80]">Recommend</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 mt-auto">
                    <AvatarImg src={pro.creators?.avatar_url} name={pro.creators?.name || '?'} className="w-8 h-8 shrink-0" />
                    <p className="text-[11px] font-black text-white line-clamp-1 min-w-0">{pro.creators?.name}</p>
                  </div>
                  <p className="text-[11px] italic text-white/55 leading-relaxed line-clamp-3">
                    &ldquo;{pro.snippet}&rdquo;
                  </p>
                </Link>

                {/* RIGHT — skips it */}
                <Link
                  href={con.creators?.handle ? `/channel/${con.creators.handle}` as any : '#'}
                  className="p-5 flex flex-col gap-3 hover:bg-white/[0.04] transition-colors"
                >
                  <div>
                    <p className="text-[40px] font-black leading-none text-[#F87171] tabular-nums">{conPercent}%</p>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-0.5">of critics</p>
                  </div>
                  <div className="self-start px-2.5 py-1 bg-[#F87171]/15 border border-[#F87171]/20">
                    <span className="text-[9px] font-black tracking-[0.2em] uppercase text-[#F87171]">Skip It</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 mt-auto">
                    <AvatarImg src={con.creators?.avatar_url} name={con.creators?.name || '?'} className="w-8 h-8 shrink-0" />
                    <p className="text-[11px] font-black text-white line-clamp-1 min-w-0">{con.creators?.name}</p>
                  </div>
                  <p className="text-[11px] italic text-white/55 leading-relaxed line-clamp-3">
                    &ldquo;{con.snippet}&rdquo;
                  </p>
                </Link>

              </div>
            </div>

            {/* Voting strip — flush at card bottom, inside rounded corners */}
            <VerdictVoteStrip movieId={movieId} />

          </div>
        ))}
      </div>
    </section>
  );
}

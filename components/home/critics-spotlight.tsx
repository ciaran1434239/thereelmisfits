import Link from 'next/link';
import { AvatarImg } from '@/components/ui/avatar-img';
import { VerdictVoteStrip } from './verdict-vote-strip';
import { getBattleOfCriticsPairs } from '@/lib/data/battle-of-critics';

export async function CriticsSpotlight() {
  const enriched = await getBattleOfCriticsPairs();
  if (!enriched.length) return null;

  return (
    /* Full-bleed red section */
    <section
      className="grain w-full relative"
      style={{
        background: 'var(--brand)',
        borderTop: '2px solid var(--ink-loud)',
        borderBottom: '2px solid var(--ink-loud)',
        paddingTop: '64px',
        paddingBottom: '64px',
      }}
    >
      {/* Stamp heading — overlaps the top border */}
      <div className="absolute top-0 left-0 px-6 sm:px-10 -translate-y-1/2">
        <div className="relative inline-block">
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: '-8px -20px',
              background: 'var(--ink-loud)',
              border: '2px solid var(--brand)',
              boxShadow: '3px 3px 0 0 #111111',
              transform: 'rotate(-1.5deg)',
              zIndex: 0,
            }}
          />
          <h2
            style={{
              position: 'relative',
              zIndex: 1,
              color: '#111111',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            Battle of the Critics
          </h2>
        </div>
      </div>

      {/* Leaderboard link — top right */}
      <div className="absolute top-4 right-6 sm:right-10">
        <Link href="/critics/league" className="btn-secondary" style={{ borderColor: '#111111', color: '#111111', boxShadow: '3px 3px 0 0 #111111' }}>
          Leaderboard →
        </Link>
      </div>

      {/* Content — constrained width */}
      <div className="max-w-[1060px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
          {enriched.map(({ movieId, movieTitle, proPercent, conPercent, pro, con, posterPath }) => (
            <div
              key={movieId}
              className="relative overflow-hidden flex flex-col"
              style={{
                background: 'rgba(0,0,0,0.75)',
                border: '2px solid var(--ink-loud)',
                boxShadow: '5px 5px 0 0 #111111',
              }}
            >
              {/* Poster bleed */}
              {posterPath && (
                <img
                  src={`https://image.tmdb.org/t/p/w780${posterPath}`}
                  alt={movieTitle}
                  className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none select-none"
                />
              )}
              <div className="absolute inset-0 bg-black/60 pointer-events-none" />

              <div className="relative z-10 flex flex-col flex-1">

                {/* Film title */}
                <div className="flex justify-center pt-5 pb-1 px-6 border-b border-white/10">
                  <p className="text-[13px] font-black uppercase tracking-[0.1em] text-white text-center leading-tight">
                    {movieTitle}
                  </p>
                </div>

                {/* Two-critic split */}
                <div className="relative grid grid-cols-2 flex-1">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-white/20 pointer-events-none" />

                  {/* LEFT — recommends */}
                  <Link
                    href={pro.creators?.handle ? `/channel/${pro.creators.handle}` as any : '#'}
                    className="p-5 flex flex-col gap-3 hover:bg-white/[0.06] transition-colors"
                  >
                    <div>
                      <p className="text-[48px] font-black leading-none tabular-nums" style={{ color: 'var(--score-green)' }}>{proPercent}%</p>
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mt-0.5">of critics</p>
                    </div>
                    <div className="self-start px-2 py-0.5 border" style={{ borderColor: 'var(--score-green)', background: 'rgba(47,191,90,0.15)' }}>
                      <span className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: 'var(--score-green)' }}>Recommend</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0 mt-auto">
                      <AvatarImg src={pro.creators?.avatar_url} name={pro.creators?.name || '?'} className="w-8 h-8 shrink-0" />
                      <p className="text-[11px] font-black text-white line-clamp-1 min-w-0">{pro.creators?.name}</p>
                    </div>
                    <p className="text-[11px] italic text-white/60 leading-relaxed line-clamp-3" style={{ fontFamily: 'var(--font-editorial, serif)' }}>
                      &ldquo;{pro.snippet}&rdquo;
                    </p>
                  </Link>

                  {/* RIGHT — skips it */}
                  <Link
                    href={con.creators?.handle ? `/channel/${con.creators.handle}` as any : '#'}
                    className="p-5 flex flex-col gap-3 hover:bg-white/[0.06] transition-colors"
                  >
                    <div>
                      <p className="text-[48px] font-black leading-none tabular-nums text-[#F87171]">{conPercent}%</p>
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mt-0.5">of critics</p>
                    </div>
                    <div className="self-start px-2 py-0.5 border border-[#F87171]/40 bg-[#F87171]/15">
                      <span className="text-[9px] font-black tracking-[0.2em] uppercase text-[#F87171]">Skip It</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0 mt-auto">
                      <AvatarImg src={con.creators?.avatar_url} name={con.creators?.name || '?'} className="w-8 h-8 shrink-0" />
                      <p className="text-[11px] font-black text-white line-clamp-1 min-w-0">{con.creators?.name}</p>
                    </div>
                    <p className="text-[11px] italic text-white/60 leading-relaxed line-clamp-3" style={{ fontFamily: 'var(--font-editorial, serif)' }}>
                      &ldquo;{con.snippet}&rdquo;
                    </p>
                  </Link>

                </div>
              </div>

              <VerdictVoteStrip movieId={movieId} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

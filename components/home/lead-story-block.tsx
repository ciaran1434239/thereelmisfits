import Link from 'next/link';
import { AvatarImg } from '@/components/ui/avatar-img';
import { getLeadStory } from '@/lib/data/lead-story';
import type { ReviewDigest } from '@/lib/data/lead-story';

const TMDB_KEY = process.env.TMDB_API_KEY;

async function fetchTmdbDetails(movieId: number) {
  if (!TMDB_KEY) return null;
  return fetch(
    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_KEY}`,
    { next: { revalidate: 3600 } },
  ).then(r => (r.ok ? r.json() : null)).catch(() => null);
}

const MODE_LABEL: Record<string, string> = {
  pinned:    'Editor\'s Pick',
  fight:     'Critics Divided',
  consensus: 'Trending',
};

function DigestRow({ review, side }: { review: ReviewDigest; side: 'pro' | 'con' }) {
  const href = review.creatorHandle ? `/channel/${review.creatorHandle}` : null;
  const dot = side === 'pro'
    ? <span className="w-2 h-2 shrink-0 mt-[3px]" style={{ background: 'var(--score-green)' }} />
    : <span className="w-2 h-2 shrink-0 mt-[3px]" style={{ background: '#F87171' }} />;

  return (
    <div className="flex gap-2.5 py-2.5" style={{ borderTop: '1px solid var(--bg-panel-edge)' }}>
      {dot}
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <AvatarImg src={review.avatarUrl} name={review.creatorName} className="w-5 h-5 shrink-0" />
          {href ? (
            <a href={href as any} className="text-[10px] font-black text-white/70 hover:text-white transition-colors line-clamp-1">
              {review.creatorName}
            </a>
          ) : (
            <span className="text-[10px] font-black text-white/70 line-clamp-1">{review.creatorName}</span>
          )}
        </div>
        {review.snippet && (
          <p className="text-[11px] text-[#8F8A82] leading-relaxed line-clamp-2 italic" style={{ fontFamily: 'var(--font-editorial, serif)' }}>
            &ldquo;{review.snippet}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

export async function LeadStoryBlock() {
  const story = await getLeadStory();
  if (!story) return <LeadStoryQuiet />;

  const tmdb = await fetchTmdbDetails(story.movieId);
  const posterUrl  = tmdb?.poster_path   ? `https://image.tmdb.org/t/p/w780${tmdb.poster_path}`           : null;
  const backdropUrl= tmdb?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdb.backdrop_path}`        : null;
  const year       = tmdb?.release_date?.substring(0, 4) ?? '';
  const runtime    = tmdb?.runtime ? `${Math.floor(tmdb.runtime / 60)}h ${tmdb.runtime % 60}m` : null;

  const scoreColor = story.pctPositive >= 60 ? 'var(--score-green)' : story.pctPositive >= 40 ? '#E0A22B' : '#F87171';
  const modeLabel  = MODE_LABEL[story.mode] ?? 'Trending';

  return (
    <div
      className="w-full relative overflow-hidden"
      style={{ borderBottom: '2px solid var(--bg-panel-edge)' }}
    >
      {/* ── Desktop layout: poster left 7/12 + digest right 5/12 ────────── */}
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-12">

          {/* Left — film art */}
          <div className="col-span-12 lg:col-span-7 relative min-h-[340px] lg:min-h-[460px]">
            {/* Backdrop / poster */}
            {(backdropUrl || posterUrl) && (
              <img
                src={backdropUrl ?? posterUrl!}
                alt={story.movieTitle}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            )}
            {/* Dark gradient overlays */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: [
                  'linear-gradient(to bottom, transparent 30%, rgba(17,17,17,0.95) 100%)',
                  'linear-gradient(to right, transparent 60%, rgba(17,17,17,0.8) 100%)',
                ].join(', '),
              }}
            />

            {/* Mode badge — top left */}
            <div className="absolute top-4 left-4 sm:left-6 z-10">
              <span
                className="text-[9px] font-black uppercase tracking-[0.25em] px-2 py-1"
                style={{ background: 'var(--brand)', color: '#fff' }}
              >
                {modeLabel}
              </span>
            </div>

            {/* Film info — bottom overlay */}
            <div className="absolute bottom-0 inset-x-0 z-10 p-4 sm:p-6 lg:p-8">
              <Link href={`/movie/${story.movieId}` as any}>
                <h2
                  className="font-[950] uppercase italic text-white leading-[0.88] tracking-[-0.04em] hover:text-[#C8201F] transition-colors"
                  style={{
                    fontSize: 'clamp(2rem, 4.5vw, 4rem)',
                    textShadow: '3px 3px 0 rgba(0,0,0,0.6)',
                  }}
                >
                  {story.headline ?? story.movieTitle}
                </h2>
              </Link>

              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-3">
                {year && <span className="text-[11px] font-bold text-white/50">{year}</span>}
                {runtime && <span className="text-[11px] font-bold text-white/50">{runtime}</span>}
                {tmdb?.genres?.slice(0, 2).map((g: { id: number; name: string }) => (
                  <span key={g.id} className="text-[10px] font-black uppercase tracking-[0.15em] text-white/35">{g.name}</span>
                ))}
              </div>

              <div className="flex items-center gap-5 mt-4">
                <div>
                  <span
                    className="text-[2.4rem] font-black leading-none tabular-nums"
                    style={{ color: scoreColor }}
                  >
                    {story.pctPositive}%
                  </span>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mt-0.5">
                    {story.reviewCount} critics
                  </p>
                </div>

                <Link
                  href={`/movie/${story.movieId}` as any}
                  className="btn-secondary self-start mt-1"
                  style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}
                >
                  All Reviews →
                </Link>
              </div>
            </div>
          </div>

          {/* Right — digest panel */}
          <div
            className="col-span-12 lg:col-span-5 flex flex-col"
            style={{ background: 'var(--bg-panel)', borderLeft: '1px solid var(--bg-panel-edge)' }}
          >
            <div className="p-5 sm:p-6 flex flex-col h-full">
              <p
                className="text-[10px] font-black uppercase tracking-[0.2em] mb-3"
                style={{ color: 'var(--score-green)' }}
              >
                Critics Say ✓
              </p>
              {story.proReviews.length === 0 && (
                <p className="text-[12px] text-[#8F8A82] italic">No positive reviews yet.</p>
              )}
              {story.proReviews.map((r, i) => (
                <DigestRow key={i} review={r} side="pro" />
              ))}

              <div className="mt-4 mb-1">
                <p
                  className="text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{ color: '#F87171' }}
                >
                  Critics Say ✗
                </p>
              </div>
              {story.conReviews.length === 0 && (
                <p className="text-[12px] text-[#8F8A82] italic">No negative reviews yet.</p>
              )}
              {story.conReviews.map((r, i) => (
                <DigestRow key={i} review={r} side="con" />
              ))}

              {(story.proReviews.length === 0 && story.conReviews.length === 0) && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[12px] text-[#8F8A82]">Reviews loading…</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function LeadStoryQuiet() {
  return (
    <div
      className="w-full flex items-center justify-center py-16 px-6 text-center"
      style={{ borderBottom: '2px solid var(--bg-panel-edge)' }}
    >
      <div>
        <p
          className="font-[900] uppercase italic tracking-[-0.04em]"
          style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: 'var(--ink-muted)' }}
        >
          The wall is quiet today.
        </p>
        <p className="text-[13px] mt-2" style={{ color: 'var(--ink-muted)' }}>
          Check back when the critics are talking.
        </p>
      </div>
    </div>
  );
}

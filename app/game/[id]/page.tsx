export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { ArrowUpRight, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { tileClasses } from '@/lib/utils/score-tier';
import { CommunityVote } from '@/components/movie/community-vote';
import { AvatarImg } from '@/components/ui/avatar-img';
import { getGameById, coverUrl, heroUrl } from '@/lib/igdb';

const SNIPPET_PROMO = [
  'subscribe','patreon','% off','podcast','discord','instagram','twitter','membership',
  'early access','merch','sponsored','click here','link below','check out','watch my',
  'in this video','wherever you get','streaming on','available on','out now','sign up',
];
const OPINION_MARKERS = [
  'love','loved','hate','hated','amazing','brilliant','masterpiece','terrible','awful',
  'boring','disappoint','incredible','stunning','perfect','excellent','wonderful','superb',
  'worst','best','fantastic','great','emotional','powerful','moving','hilarious','gripping',
  'breathtaking','genuinely','honestly','truly','absolutely','surprisingly','remarkable',
  'exciting','dull','weak','strong','outstanding','overrated','underrated','addictive',
  'frustrating','immersive','repetitive','polished','broken','fun','boring',
];

function isUsefulSnippet(text: string) {
  if (!text || text.length < 40) return false;
  const lower = text.toLowerCase().trim();
  if (lower.startsWith('#')) return false;
  if (SNIPPET_PROMO.some(p => lower.includes(p))) return false;
  if (/https?:\/\/\S+/.test(text)) return false;
  return OPINION_MARKERS.some(w => lower.includes(w)) ||
    /\b(i |i'm |i've |i was |i felt |i think|i found|i enjoyed)\b/.test(lower);
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gameId = parseInt(id);
  if (isNaN(gameId)) notFound();

  const [igdb, { data: reviews }] = await Promise.all([
    getGameById(gameId),
    supabase
      .from('reviews')
      .select('*, creators(id, name, handle, avatar_url)')
      .eq('game_id', gameId)
      .order('posted_at', { ascending: false }),
  ]);

  // Fall back to DB title if IGDB is unavailable
  const { data: dbGame } = await supabase.from('games').select('title, cover_image_id, hero_image_id').eq('id', gameId).single();
  if (!igdb && !dbGame) notFound();

  const title       = igdb?.name ?? dbGame?.title ?? 'Unknown Game';
  const coverImgId  = igdb?.cover?.image_id ?? dbGame?.cover_image_id ?? null;
  const heroImgId   = igdb?.heroImageId ?? dbGame?.hero_image_id ?? null;
  const summary     = igdb?.summary ?? '';
  const genres: string[]    = igdb?.genres?.map((g: any) => g.name) ?? [];
  const platforms: string[] = igdb?.platforms?.map((p: any) => p.name) ?? [];
  const releaseYear = igdb?.first_release_date
    ? new Date(igdb.first_release_date * 1000).getFullYear()
    : null;

  const totalReviews = reviews?.length ?? 0;
  const MIN_REVIEWS  = 4;
  const scored       = (reviews ?? []).filter(r => r.recommend !== null);
  const recCount     = scored.filter(r => r.recommend === true).length;
  const recPct       = scored.length >= MIN_REVIEWS ? Math.round((recCount / scored.length) * 100) : null;
  const isPending    = totalReviews > 0 && scored.length < MIN_REVIEWS;

  return (
    <div className="min-h-screen">

      {/* ── Cinematic backdrop hero ── */}
      <div className="relative w-full h-[240px] sm:h-[300px] overflow-hidden bg-[#111]">
        {heroImgId ? (
          <img
            src={heroUrl(heroImgId)}
            alt="" aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40"
          />
        ) : coverImgId ? (
          <img
            src={coverUrl(coverImgId)}
            alt="" aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-top opacity-20 blur-sm scale-110"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 lg:gap-12">

          {/* ── Sidebar ── */}
          <aside className="flex flex-col gap-4 md:-mt-24 relative z-10">
            {/* 2:3 box art — object-cover so slight ratio variations are cleanly cropped */}
            {coverImgId ? (
              <img
                src={coverUrl(coverImgId)}
                alt={title}
                className="w-full aspect-[2/3] object-cover rounded-xl shadow-2xl shadow-black/40"
              />
            ) : (
              <div className="w-full aspect-[2/3] rounded-xl bg-[#222222] flex items-center justify-center p-4">
                <span className="text-sm font-black uppercase text-[#555] text-center">{title}</span>
              </div>
            )}

            {/* Score tiles */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl p-4 text-center ${
                recPct !== null
                  ? tileClasses(recPct)
                  : isPending
                    ? 'bg-[#1E1E1E] border border-[#333] border-dashed'
                    : 'bg-[#1E1E1E] border border-[#2A2A2A] border-t-2 border-t-[#E21D1D]'
              }`}>
                <div className={`text-3xl font-black leading-none ${recPct === null ? 'text-[#777777]' : ''}`}>
                  {recPct !== null ? `${recPct}%` : isPending ? '?' : '?'}
                </div>
                <div className={`text-[8px] font-black uppercase tracking-widest mt-1 ${recPct !== null ? 'opacity-70' : isPending ? 'text-[#999999]' : 'text-[#777777]'}`}>
                  {isPending ? 'Pending' : 'YouTube'}
                </div>
                <div className={`text-[8px] font-bold mt-0.5 ${recPct !== null ? 'opacity-60' : 'text-[#777777]'}`}>
                  {isPending
                    ? `${scored.length} of ${MIN_REVIEWS} scored`
                    : `${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'}`}
                </div>
              </div>
              <CommunityVote movieId={gameId} initialVotes={[]} compact />
            </div>

            {/* Metadata */}
            <div className="bg-[#181818] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
              {igdb?.dev && (
                <div>
                  <p className="text-[9px] font-black text-[#777777] uppercase tracking-widest mb-0.5">Developer</p>
                  <p className="text-[13px] font-bold text-white">{igdb.dev}</p>
                </div>
              )}
              {igdb?.pub && igdb.pub !== igdb.dev && (
                <div>
                  <p className="text-[9px] font-black text-[#777777] uppercase tracking-widest mb-0.5">Publisher</p>
                  <p className="text-[13px] font-bold text-white">{igdb.pub}</p>
                </div>
              )}
              {releaseYear && (
                <div>
                  <p className="text-[9px] font-black text-[#777777] uppercase tracking-widest mb-0.5">Released</p>
                  <p className="text-[13px] font-bold text-white">{releaseYear}</p>
                </div>
              )}
              {platforms.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-[#777777] uppercase tracking-widest mb-1">Platforms</p>
                  <div className="flex flex-wrap gap-1">
                    {platforms.slice(0, 6).map(p => (
                      <span key={p} className="text-[10px] font-bold border border-[#333333] text-[#999999] px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {genres.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-[#777777] uppercase tracking-widest mb-1">Genres</p>
                  <div className="flex flex-wrap gap-1">
                    {genres.map(g => (
                      <span key={g} className="text-[10px] font-bold border border-[#333333] text-[#999999] px-2 py-0.5 rounded-full">{g}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="flex flex-col gap-6 min-w-0 pt-4 md:pt-6">
            <div>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tighter leading-[0.9] text-white uppercase italic mb-3">
                {title}
              </h1>
              {igdb?.dev && (
                <p className="text-sm font-bold text-[#777777] uppercase tracking-widest">
                  {igdb.dev}{releaseYear && ` · ${releaseYear}`}
                </p>
              )}
            </div>

            {summary && (
              <div className="text-base sm:text-lg font-medium leading-relaxed text-[#D4D4D4] border-l-4 border-[#E21D1D] pl-5 italic">
                {summary}
              </div>
            )}

            {/* Reviews */}
            <div className={`rounded-2xl overflow-hidden ${
              totalReviews === 0 ? 'bg-[#1E1E1E]' : 'bg-[#181818] border border-[#2A2A2A]'
            }`}>
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[#2A2A2A]">
                
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">
                  YouTube Reviews ({totalReviews})
                </h3>
              </div>

              {totalReviews === 0 ? (
                <p className="text-[#777777] font-bold text-sm py-10 text-center">No reviews synced yet</p>
              ) : (
                <div className="px-6 py-2">
                  <div className="flex flex-col divide-y divide-[#2A2A2A]">
                    {(reviews ?? []).map(review => {
                      const snippet = isUsefulSnippet(review.snippet) ? review.snippet : null;
                      return (
                        <article key={review.id} className="py-5 flex gap-4">
                          <AvatarImg
                            src={review.creators?.avatar_url}
                            name={review.creators?.name || 'C'}
                            className="w-11 h-11 mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <span className="text-sm font-black text-white">{review.creators?.name}</span>
                              {review.recommend === true && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-[#2BA640] text-white">
                                  <ThumbsUp size={11} strokeWidth={2.5} /> Recommends
                                </span>
                              )}
                              {review.recommend === false && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-[#E21D1D] text-white">
                                  <ThumbsDown size={11} strokeWidth={2.5} /> Skip it
                                </span>
                              )}
                              {review.recommend === null && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#333333] text-[#777777]">
                                  <Minus size={10} /> Unscored
                                </span>
                              )}
                            </div>
                            {snippet ? (
                              <p className="text-sm leading-relaxed mb-3 pl-3 line-clamp-3 text-[#AAAAAA] border-l-2 border-[#E21D1D]/40">
                                {snippet}
                              </p>
                            ) : (
                              <p className="text-xs text-[#777777] italic mb-3">Check out the full review on YouTube</p>
                            )}
                            <a
                              href={`https://youtube.com/watch?v=${review.youtube_video_id}`}
                              target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#777777] hover:text-[#FF0000] transition-colors"
                            >
                              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#FF0000]">
                                <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/>
                              </svg>
                              Watch on YouTube <ArrowUpRight size={12} />
                            </a>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { ArrowUpRight, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CommunityVote } from '@/components/movie/community-vote';
import { tileClasses } from '@/lib/utils/score-tier';
import { AvatarImg } from '@/components/ui/avatar-img';

async function getTMDBShow(id: string) {
  const apiKey = process.env.TMDB_API_KEY;
  try {
    const [details, credits] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}`, { next: { revalidate: 86400 } })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://api.themoviedb.org/3/tv/${id}/credits?api_key=${apiKey}`, { next: { revalidate: 86400 } })
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    if (!details) return null;
    const creator = details.created_by?.[0]?.name ?? null;
    const cast = credits?.cast?.slice(0, 5).map((c: any) => c.name) ?? [];
    return { ...details, creator, cast };
  } catch {
    return null;
  }
}

export default async function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [tmdb, { data: reviews }] = await Promise.all([
    getTMDBShow(id),
    supabase
      .from('reviews')
      .select('*, creators(id, name, handle, avatar_url)')
      .eq('show_id', parseInt(id))
      .order('season_number', { ascending: true, nullsFirst: false })
      .order('posted_at', { ascending: false }),
  ]);

  if (!tmdb) notFound();

  const MIN_REVIEWS = 4;
  const totalReviews = reviews?.length ?? 0;

  // Collapse to one vote per creator per season — a channel that reviews every episode
  // should count as one voice, not N. Keep the most recent review per (creator, season).
  type Review = NonNullable<typeof reviews>[number];
  const seenCreatorSeason = new Map<string, Review>();
  for (const r of reviews ?? []) {
    const key = `${r.creator_id}::${r.season_number ?? 'none'}`;
    const existing = seenCreatorSeason.get(key);
    if (!existing || r.posted_at > existing.posted_at) seenCreatorSeason.set(key, r);
  }
  const dedupedReviews = Array.from(seenCreatorSeason.values());

  const scoredReviews = dedupedReviews.filter(r => r.recommend !== null);
  const recCount = scoredReviews.filter(r => r.recommend).length;
  const isPending = totalReviews > 0 && scoredReviews.length < MIN_REVIEWS;
  const recPct = scoredReviews.length >= MIN_REVIEWS ? Math.round((recCount / scoredReviews.length) * 100) : null;

  const firstAirYear = tmdb.first_air_date?.substring(0, 4);
  const seasons = tmdb.number_of_seasons;

  // Group reviews by season
  const bySeason = new Map<number | null, typeof reviews>();
  for (const r of reviews ?? []) {
    const key = r.season_number ?? null;
    if (!bySeason.has(key)) bySeason.set(key, []);
    bySeason.get(key)!.push(r);
  }

  const SNIPPET_PROMO = ['subscribe','patreon','% off','listeners get','podcast','discord','instagram','twitter','membership','early access','merch','sponsored','click here','link below','check out','watch my','in this video','my review','wherever you get','streaming on','available on','out now','sign up'];
  const OPINION_MARKERS = ['love','loved','hate','hated','amazing','brilliant','masterpiece','terrible','awful','boring','disappoint','incredible','stunning','perfect','excellent','wonderful','superb','worst','best','fantastic','great','emotional','powerful','moving','hilarious','terrifying','gripping','breathtaking','genuinely','honestly','truly','absolutely','surprisingly','remarkable','funny','scary','beautiful','exciting','dull','weak','strong','outstanding','overrated','underrated'];

  function isUsefulSnippet(text: string) {
    if (!text || text.length < 40) return false;
    const lower = text.toLowerCase().trim();
    if (lower.startsWith('#')) return false;
    if (SNIPPET_PROMO.some(p => lower.includes(p))) return false;
    if (/https?:\/\/\S+/.test(text)) return false;
    const hasOpinion = OPINION_MARKERS.some(w => lower.includes(w));
    const hasFirstPerson = /\b(i |i'm |i've |i was |i felt |i think|i found|i enjoyed|we loved|we hated)\b/.test(lower);
    return hasOpinion || hasFirstPerson;
  }

  return (
    <div className="min-h-screen">

      {/* ── BACKDROP HERO — purely atmospheric, no text overlay ─────────────── */}
      <div className="relative w-full h-[240px] sm:h-[300px] overflow-hidden bg-[#111]">
        {tmdb.backdrop_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w1280${tmdb.backdrop_path}`}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-[center_20%] opacity-35"
          />
        ) : tmdb.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w780${tmdb.poster_path}`}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-top opacity-20 blur-sm"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────────── */}
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 lg:gap-12">

          {/* LEFT SIDEBAR — poster overlaps the backdrop via negative top margin */}
          <aside className="flex flex-col gap-4 md:-mt-24 relative z-10">
            {tmdb.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${tmdb.poster_path}`}
                alt={tmdb.name}
                className="w-full aspect-[2/3] object-cover rounded-xl shadow-2xl shadow-black/40"
              />
            ) : (
              <div className="w-full aspect-[2/3] rounded-xl bg-[#222222]" />
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl p-4 text-center ${
                recPct !== null
                  ? tileClasses(recPct)
                  : isPending ? 'bg-[#1E1E1E] border border-[#333] border-dashed' : 'bg-[#1E1E1E] border border-[#2A2A2A] border-t-2 border-t-[#E21D1D]'
              }`}>
                <div className={`text-3xl font-black leading-none ${recPct === null ? 'text-[#777777]' : ''}`}>
                  {recPct !== null ? `${recPct}%` : isPending ? '?' : '?'}
                </div>
                <div className={`text-[8px] font-black uppercase tracking-widest mt-1 ${
                  recPct !== null ? 'opacity-70' : isPending ? 'text-[#999999]' : 'text-[#777777]'
                }`}>
                  {isPending ? 'Pending' : 'YouTube'}
                </div>
                <div className={`text-[8px] font-bold mt-0.5 ${
                  recPct !== null ? 'opacity-60' : 'text-[#777777]'
                }`}>
                  {isPending
                    ? scoredReviews.length === 0
                      ? `${totalReviews} unscored`
                      : `${scoredReviews.length} of ${MIN_REVIEWS} scored`
                    : `${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'}`}
                </div>
              </div>
              <CommunityVote movieId={parseInt(id)} initialVotes={[]} compact />
            </div>

            <div className="bg-[#181818] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
              {tmdb.creator && (
                <div>
                  <p className="text-[9px] font-black text-[#777777] uppercase tracking-widest mb-0.5">Created by</p>
                  <p className="text-[13px] font-bold text-white">{tmdb.creator}</p>
                </div>
              )}
              {tmdb.cast?.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-[#777777] uppercase tracking-widest mb-0.5">Cast</p>
                  <p className="text-[12px] text-[#AAAAAA] leading-relaxed">{tmdb.cast.join(', ')}</p>
                </div>
              )}
              <div className="flex gap-6 flex-wrap">
                {firstAirYear && (
                  <div>
                    <p className="text-[9px] font-black text-[#777777] uppercase tracking-widest mb-0.5">First Aired</p>
                    <p className="text-[13px] font-bold text-white">{firstAirYear}</p>
                  </div>
                )}
                {seasons > 0 && (
                  <div>
                    <p className="text-[9px] font-black text-[#777777] uppercase tracking-widest mb-0.5">Seasons</p>
                    <p className="text-[13px] font-bold text-white">{seasons}</p>
                  </div>
                )}
              </div>
              {tmdb.genres?.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-[#777777] uppercase tracking-widest mb-1">Genres</p>
                  <div className="flex flex-wrap gap-1">
                    {tmdb.genres.map((g: any) => (
                      <span key={g.id} className="text-[10px] font-bold border border-[#333333] text-[#999999] px-2 py-0.5 rounded-full">{g.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT */}
          <main className="flex flex-col gap-6 min-w-0 pt-4 md:pt-6">
            <div>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tighter leading-[0.9] text-white uppercase italic mb-3">
                {tmdb.name}
              </h1>
              {tmdb.creator && (
                <p className="text-sm font-bold text-[#777777] uppercase tracking-widest">
                  Created by {tmdb.creator}{firstAirYear && ` · ${firstAirYear}`}
                </p>
              )}
            </div>

            {tmdb.overview && (
              <div className="text-base sm:text-lg font-medium leading-relaxed text-[#D4D4D4] border-l-4 border-[#E21D1D] pl-5 italic">
                {tmdb.overview}
              </div>
            )}

            {/* Reviews */}
            <div className={`rounded-2xl overflow-hidden ${
              totalReviews === 0
                ? 'bg-[#1E1E1E]'
                : 'bg-[#181818] border border-[#2A2A2A]'
            }`}>
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[#2A2A2A]">
                
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">
                  YouTube Reviews ({totalReviews})
                </h3>
              </div>

              {totalReviews === 0 ? (
                <p className="text-[#777777] font-bold text-sm py-10 text-center">
                  No reviews synced yet
                </p>
              ) : (
                <div className="px-6 py-2">
                <div className="flex flex-col gap-6">
                  {Array.from(bySeason.entries())
                    .sort(([a], [b]) => (a ?? 999) - (b ?? 999))
                    .map(([season, seasonReviews]) => (
                      <div key={season ?? 'general'}>
                        {season !== null && (
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#777777] mb-3">
                            Season {season}
                          </p>
                        )}
                        <div className="flex flex-col divide-y divide-[#2A2A2A]">
                          {seasonReviews!.map((review) => {
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
                                        <ThumbsUp size={11} strokeWidth={2.5} />
                                        Recommends
                                      </span>
                                    )}
                                    {review.recommend === false && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-[#E21D1D] text-white">
                                        <ThumbsDown size={11} strokeWidth={2.5} />
                                        Skip it
                                      </span>
                                    )}
                                    {review.recommend === null && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#333333] text-[#777777]">
                                        <Minus size={10} />
                                        Unscored
                                      </span>
                                    )}
                                  </div>
                                  {snippet ? (
                                    <p className="text-sm leading-relaxed mb-3 pl-3 line-clamp-3 text-[#AAAAAA] border-l-2 border-[#E21D1D]/40">
                                      {snippet}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-[#777777] italic mb-3">
                                      Check out the full review on YouTube
                                    </p>
                                  )}
                                  <a
                                    href={`https://youtube.com/watch?v=${review.youtube_video_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#777777] hover:text-[#FF0000] transition-colors"
                                  >
                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#FF0000]" xmlns="http://www.w3.org/2000/svg">
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
                    ))}
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

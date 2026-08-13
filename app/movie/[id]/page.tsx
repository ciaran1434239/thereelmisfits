export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { ArrowUpRight, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { tileClasses } from '@/lib/utils/score-tier';
import { CommunityVote } from '@/components/movie/community-vote';
import { AvatarImg } from '@/components/ui/avatar-img';

// Platform brand colours keyed by TMDB provider_id
const PLATFORM_STYLES: Record<number, { name: string; bg: string; text: string }> = {
  8:    { name: 'Netflix',       bg: '#E50914', text: '#fff' },
  175:  { name: 'Netflix',       bg: '#E50914', text: '#fff' },
  119:  { name: 'Prime Video',   bg: '#00A8E1', text: '#fff' },
  337:  { name: 'Disney+',       bg: '#113CCF', text: '#fff' },
  2:    { name: 'Apple TV+',     bg: '#1C1C1E', text: '#fff' },
  350:  { name: 'Apple TV',      bg: '#1C1C1E', text: '#fff' },
  15:   { name: 'Hulu',          bg: '#1CE783', text: '#000' },
  531:  { name: 'Paramount+',    bg: '#0064FF', text: '#fff' },
  1899: { name: 'Max',           bg: '#002BE7', text: '#fff' },
  384:  { name: 'Max',           bg: '#002BE7', text: '#fff' },
  283:  { name: 'Crunchyroll',   bg: '#F47521', text: '#fff' },
  39:   { name: 'Now',           bg: '#00A550', text: '#fff' },
  103:  { name: 'MUBI',          bg: '#C7A97B', text: '#1a1a1a' },
  38:   { name: 'BBC iPlayer',   bg: '#FF4E00', text: '#fff' },
  582:  { name: 'Sky Go',        bg: '#005AFF', text: '#fff' },
  29:   { name: 'Sky Store',     bg: '#005AFF', text: '#fff' },
  10:   { name: 'Amazon Video',  bg: '#00A8E1', text: '#fff' },
};

async function getTMDBDetails(id: string) {
  const apiKey = process.env.TMDB_API_KEY;
  try {
    const [details, credits, watchData] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`, { next: { revalidate: 86400 } })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${apiKey}`, { next: { revalidate: 86400 } })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${apiKey}`, { next: { revalidate: 86400 } })
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    if (!details) return null;
    const director = credits?.crew?.find((c: any) => c.job === 'Director')?.name ?? null;
    const cast = credits?.cast?.slice(0, 5).map((c: any) => c.name) ?? [];
    // Use GB providers first, fall back to US
    const providers: any = watchData?.results?.['GB'] ?? watchData?.results?.['US'] ?? null;
    // Studio names as text (never logo images)
    const studios: string[] = (details.production_companies ?? [])
      .slice(0, 3)
      .map((c: any) => c.name as string)
      .filter(Boolean);
    return { ...details, director, cast, providers, studios };
  } catch {
    return null;
  }
}

function fmtMoney(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return null;
}

const SNIPPET_PROMO = [
  'subscribe', 'patreon', '% off', 'listeners get', 'podcast', 'discord', 'instagram',
  'twitter', 'membership', 'early access', 'merch', 'sponsored', 'free gift', 'free shipping',
  'click here', 'link below', 'check out', 'watch my', 'in this video', 'my review',
  'wherever you get', 'streaming on', 'available on', 'out now', 'sign up',
];

const OPINION_MARKERS = [
  'love', 'loved', 'hate', 'hated', 'amazing', 'brilliant', 'masterpiece', 'terrible',
  'awful', 'boring', 'disappoint', 'incredible', 'stunning', 'perfect', 'excellent',
  'wonderful', 'superb', 'worst', 'best', 'fantastic', 'great', 'emotional', 'powerful',
  'moving', 'hilarious', 'terrifying', 'gripping', 'breathtaking', 'genuinely', 'honestly',
  'truly', 'absolutely', 'surprisingly', 'remarkable', 'funny', 'scary', 'beautiful',
  'exciting', 'dull', 'weak', 'strong', 'outstanding', 'overrated', 'underrated',
];

function isUsefulSnippet(text: string) {
  if (!text || text.length < 40) return false;
  const lower = text.toLowerCase().trim();
  if (lower.startsWith('#')) return false;
  const words = lower.split(/\s+/);
  if (words.filter(w => w.startsWith('#')).length / words.length > 0.3) return false;
  if (SNIPPET_PROMO.some(p => lower.includes(p))) return false;
  if (/https?:\/\/\S+/.test(text)) return false;
  const hasOpinion = OPINION_MARKERS.some(w => lower.includes(w));
  const hasFirstPerson = /\b(i |i'm |i've |i was |i felt |i think|i found|i enjoyed|we loved|we hated)\b/.test(lower);
  return hasOpinion || hasFirstPerson;
}

// Only use title as a fallback if it sounds like an actual opinion, not a generic "Movie Review" title
const TITLE_OPINION_WORDS = [
  'recommend', 'love', 'loved', 'hate', 'hated', 'amazing', 'brilliant', 'terrible', 'awful',
  'boring', 'disappoint', 'incredible', 'perfect', 'worst', 'best', 'fantastic', 'worth it',
  'skip', 'must', 'great', 'bad', 'masterpiece', 'overrated', 'underrated', 'impressed',
  'blown away', 'mind', 'stunning', 'beautiful', 'hilarious', 'terrifying', 'emotional',
  'finally', 'better than', 'worse than', 'not what', 'actually', 'honest',
];

function isOpinionatedTitle(title: string) {
  if (!title || title.startsWith('#')) return false;
  // Filter out generic "ending explained", "breakdown", "trailer reaction" titles
  const lower = title.toLowerCase();
  if (/ending explained|movie breakdown|book differences|film breakdown|scene breakdown|trailer reaction/.test(lower)) return false;
  return TITLE_OPINION_WORDS.some(w => lower.includes(w));
}

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [tmdb, { data: reviews }, { data: communityVotes }] = await Promise.all([
    getTMDBDetails(id),
    supabase
      .from('reviews')
      .select('*, creators(id, name, handle, avatar_url)')
      .eq('movie_id', parseInt(id))
      .order('posted_at', { ascending: false }),
    supabase
      .from('user_votes')
      .select('recommend')
      .eq('movie_id', parseInt(id)),
  ]);

  if (!tmdb) notFound();

  const MIN_REVIEWS = 4;
  const totalReviews = reviews?.length ?? 0;
  const scoredReviews = reviews?.filter(r => r.recommend !== null) ?? [];
  const recCount = scoredReviews.filter(r => r.recommend).length;
  const isPending = totalReviews > 0 && scoredReviews.length < MIN_REVIEWS;
  const recPct = scoredReviews.length >= MIN_REVIEWS ? Math.round((recCount / scoredReviews.length) * 100) : null;

  const releaseYear = tmdb.release_date?.substring(0, 4);
  const budget = tmdb.budget > 100000 ? fmtMoney(tmdb.budget) : null;
  const revenue = tmdb.revenue > 100000 ? fmtMoney(tmdb.revenue) : null;

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

            {/* Poster */}
            {tmdb.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${tmdb.poster_path}`}
                alt={tmdb.title}
                className="w-full aspect-[2/3] object-cover rounded-xl shadow-2xl shadow-black/40"
              />
            ) : (
              <div className="w-full aspect-[2/3] rounded-xl bg-[#222222]" />
            )}

            {/* YouTube score + community score side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl p-4 text-center ${
                recPct !== null
                  ? tileClasses(recPct)
                  : isPending ? 'bg-[#1E1E1E] border border-[#333] border-dashed' : 'bg-[#1E1E1E] border border-[#2A2A2A] border-t-2 border-t-[#E21D1D]'
              }`}>
                {/* Children inherit the tile's text colour — no explicit text-white needed */}
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
              <CommunityVote movieId={parseInt(id)} initialVotes={communityVotes ?? []} compact />
            </div>

            {/* Film details */}
            <div className="bg-[#181818] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
              {tmdb.director && (
                <div>
                  <p className="text-[9px] font-black text-[#777777] uppercase tracking-widest mb-0.5">Director</p>
                  <p className="text-[13px] font-bold text-white">{tmdb.director}</p>
                </div>
              )}
              {tmdb.cast?.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-[#777777] uppercase tracking-widest mb-0.5">Cast</p>
                  <p className="text-[12px] text-[#AAAAAA] leading-relaxed">{tmdb.cast.join(', ')}</p>
                </div>
              )}
              {releaseYear && (
                <div className="flex gap-6">
                  <div>
                    <p className="text-[9px] font-black text-[#777777] uppercase tracking-widest mb-0.5">Released</p>
                    <p className="text-[13px] font-bold text-white">{releaseYear}</p>
                  </div>
                  {tmdb.runtime > 0 && (
                    <div>
                      <p className="text-[9px] font-black text-[#777777] uppercase tracking-widest mb-0.5">Runtime</p>
                      <p className="text-[13px] font-bold text-white">{tmdb.runtime} min</p>
                    </div>
                  )}
                </div>
              )}
              {(budget || revenue) && (
                <div className="flex gap-6">
                  {budget && (
                    <div>
                      <p className="text-[9px] font-black text-[#777777] uppercase tracking-widest mb-0.5">Budget</p>
                      <p className="text-[13px] font-bold text-white">{budget}</p>
                    </div>
                  )}
                  {revenue && (
                    <div>
                      <p className="text-[9px] font-black text-[#777777] uppercase tracking-widest mb-0.5">Box Office</p>
                      <p className="text-[13px] font-bold text-white">{revenue}</p>
                    </div>
                  )}
                </div>
              )}
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
              {tmdb.studios?.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-[#777777] uppercase tracking-widest mb-0.5">Studio</p>
                  <p className="text-[12px] text-[#888888]">{(tmdb.studios as string[]).join(' · ')}</p>
                </div>
              )}
            </div>

          </aside>

          {/* RIGHT: title → where to watch → synopsis → reviews */}
          <main className="flex flex-col gap-6 min-w-0 pt-4 md:pt-6">

            {/* Title — lives in the content column so it never fights the poster */}
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-[0.92] text-white uppercase italic mb-2">
                {tmdb.title}
              </h1>
              {tmdb.director && (
                <p className="text-sm font-bold text-[#999999] uppercase tracking-widest">
                  Directed by {tmdb.director}{releaseYear && ` · ${releaseYear}`}
                </p>
              )}
            </div>

            {/* Where to Watch — most actionable info after the title */}
            {tmdb.providers && (tmdb.providers.flatrate?.length || tmdb.providers.rent?.length || tmdb.providers.buy?.length) ? (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#777777]">Where to Watch</p>

                {/* Streaming — full-colour branded pills */}
                {tmdb.providers.flatrate?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(tmdb.providers.flatrate as any[]).map((p: any) => {
                      const style = PLATFORM_STYLES[p.provider_id] ?? { name: p.provider_name, bg: '#2A2A2A', text: '#ccc' };
                      return (
                        <span
                          key={p.provider_id}
                          className="inline-flex items-center gap-1.5 text-[12px] font-black px-3.5 py-2 rounded-full leading-none"
                          style={{ backgroundColor: style.bg, color: style.text }}
                        >
                          {/* Play icon */}
                          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current shrink-0" aria-hidden>
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          Stream on {style.name}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Rent / Buy — muted outlined pills */}
                {(tmdb.providers.rent?.length || tmdb.providers.buy?.length) ? (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/25 mr-1">Rent or buy:</span>
                    {((tmdb.providers.rent ?? tmdb.providers.buy ?? []) as any[])
                      .filter((p, i, arr) => arr.findIndex((x: any) => x.provider_id === p.provider_id) === i)
                      .slice(0, 6)
                      .map((p: any) => {
                        const name = (PLATFORM_STYLES[p.provider_id]?.name) ?? p.provider_name;
                        return (
                          <span
                            key={p.provider_id}
                            className="text-[10px] font-bold text-white/50 border border-white/[0.14] px-2.5 py-1 rounded-full"
                          >
                            {name}
                          </span>
                        );
                      })
                    }
                  </div>
                ) : null}
              </div>
            ) : null}

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
                <div className="divide-y divide-[#2A2A2A]">
                  {reviews!.map((review) => {
                    const snippet = isUsefulSnippet(review.snippet) ? review.snippet : null;
                    const titleQuote = isOpinionatedTitle(review.title) ? review.title : null;
                    const displayText = snippet ?? titleQuote;
                    const isRec = review.recommend === true;
                    const isPass = review.recommend === false;

                    return (
                      <article key={review.id} className="px-6 py-5 flex gap-4">
                        <AvatarImg
                          src={review.creators?.avatar_url}
                          name={review.creators?.name || 'C'}
                          className="w-12 h-12 mt-0.5 shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                            <span className="text-sm font-black text-white">{review.creators?.name}</span>
                            {isRec && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-[#2BA640] text-white">
                                <ThumbsUp size={11} strokeWidth={2.5} />
                                Recommends
                              </span>
                            )}
                            {isPass && (
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

                          {displayText ? (
                            <p className={`text-sm leading-relaxed mb-3 pl-3 line-clamp-3 ${
                              snippet
                                ? 'text-[#AAAAAA] border-l-2 border-[#E21D1D]/50'
                                : 'text-[#999999] italic border-l-2 border-[#2A2A2A]'
                            }`}>
                              {snippet ? displayText : `"${displayText}"`}
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
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

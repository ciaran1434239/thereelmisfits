export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getScoreTier } from '@/lib/utils/score-tier';
import { CommunityVote } from '@/components/movie/community-vote';
import { AvatarPlain } from '@/components/ui/avatar-plain';
import { TicketStub } from '@/components/ui/ticket-stub';
import { SectionTitle } from '@/components/home/section-title';

const HEADLINE = 'var(--font-headline), Georgia, serif';
const DISPLAY  = 'var(--font-display), Impact, sans-serif';
const TIER_COLOR = { recommend: '#16803A', okay: '#B7791F', pass: '#C8201F' } as const;

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

  const tierColor = recPct !== null ? TIER_COLOR[getScoreTier(recPct)] : '#555';

  const Detail = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="py-3" style={{ borderBottom: '1px solid #E4E4E4' }}>
      <p className="uppercase" style={{ fontFamily: DISPLAY, fontSize: '1rem', letterSpacing: '0.07em', color: '#555' }}>{label}</p>
      <div className="text-[15px] leading-snug mt-0.5" style={{ color: '#111' }}>{children}</div>
    </div>
  );

  return (
    <div className="pb-24">

      {/* ── Backdrop ───────────────────────────────────────────────────────── */}
      {(tmdb.backdrop_path || tmdb.poster_path) && (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
          <div className="relative overflow-hidden" style={{ aspectRatio: '21/9', background: '#E8E8E8', border: '1px solid #111' }}>
            <img
              src={tmdb.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdb.backdrop_path}` : `https://image.tmdb.org/t/p/w780${tmdb.poster_path}`}
              alt={tmdb.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* ── Title + scores ─────────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-8 items-end">
          <div className="lg:col-span-8">
            <p className="uppercase" style={{ fontFamily: DISPLAY, fontSize: '1.15rem', letterSpacing: '0.06em', color: '#111' }}>
              <span style={{ color: '#C8201F' }}>{tmdb.genres?.slice(0, 2).map((g: any) => g.name).join(' / ') || 'Film'}</span>
              {releaseYear && <> / {releaseYear}</>}
              {tmdb.runtime > 0 && <> / {tmdb.runtime} min</>}
            </p>
            <h1 className="mt-2" style={{ fontFamily: HEADLINE, fontWeight: 700, fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)', lineHeight: 1.03, color: '#111' }}>
              {tmdb.title}
            </h1>
            {tmdb.director && (
              <p className="mt-3 uppercase" style={{ fontFamily: DISPLAY, fontSize: '1.15rem', letterSpacing: '0.06em', color: '#555' }}>
                Directed by <span style={{ color: '#111' }}>{tmdb.director}</span>
              </p>
            )}
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <div style={{ fontFamily: DISPLAY, fontSize: '3.5rem', lineHeight: 0.9, color: tierColor }}>
                {recPct !== null ? `${recPct}%` : '?'}
              </div>
              <div className="uppercase" style={{ fontFamily: DISPLAY, fontSize: '1.05rem', letterSpacing: '0.06em', color: '#555' }}>
                {isPending
                  ? `Pending / ${scoredReviews.length} of ${MIN_REVIEWS} scored`
                  : `YouTube / ${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'}`}
              </div>
            </div>
            <CommunityVote movieId={parseInt(id)} initialVotes={communityVotes ?? []} compact />
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-x-12 gap-y-10">

          <aside className="flex flex-col gap-6">
            {tmdb.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w500${tmdb.poster_path}`}
                alt={tmdb.title}
                className="w-40 md:w-full object-cover"
                style={{ aspectRatio: '2/3', border: '1px solid #111' }}
              />
            )}
            <div style={{ borderTop: '1px solid #111' }}>
              {tmdb.cast?.length > 0 && <Detail label="Cast">{tmdb.cast.join(', ')}</Detail>}
              {budget && <Detail label="Budget">{budget}</Detail>}
              {revenue && <Detail label="Box office">{revenue}</Detail>}
              {tmdb.studios?.length > 0 && <Detail label="Studio">{(tmdb.studios as string[]).join(' · ')}</Detail>}
            </div>
          </aside>

          <main className="min-w-0 flex flex-col gap-10">

            {tmdb.overview && (
              <p className="text-[19px] sm:text-[21px] leading-relaxed max-w-[62ch]" style={{ fontFamily: HEADLINE, color: '#222' }}>
                {tmdb.overview}
              </p>
            )}

            {tmdb.providers && (tmdb.providers.flatrate?.length || tmdb.providers.rent?.length || tmdb.providers.buy?.length) ? (
              <div className="flex flex-col gap-3">
                <p className="uppercase" style={{ fontFamily: DISPLAY, fontSize: '1.15rem', letterSpacing: '0.06em', color: '#111' }}>
                  <span style={{ color: '#C8201F' }}>Where to watch</span>
                </p>

                {tmdb.providers.flatrate?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(tmdb.providers.flatrate as any[]).map((p: any) => {
                      const style = PLATFORM_STYLES[p.provider_id] ?? { name: p.provider_name, bg: '#2A2A2A', text: '#fff' };
                      return (
                        <span key={p.provider_id} className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3.5 py-2 leading-none" style={{ backgroundColor: style.bg, color: style.text }}>
                          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current shrink-0" aria-hidden><path d="M8 5v14l11-7z" /></svg>
                          Stream on {style.name}
                        </span>
                      );
                    })}
                  </div>
                )}

                {(tmdb.providers.rent?.length || tmdb.providers.buy?.length) ? (
                  <p className="text-[13px]" style={{ color: '#555' }}>
                    <span className="font-bold" style={{ color: '#111' }}>Rent or buy:</span>{' '}
                    {((tmdb.providers.rent ?? tmdb.providers.buy ?? []) as any[])
                      .filter((p, i, arr) => arr.findIndex((x: any) => x.provider_id === p.provider_id) === i)
                      .slice(0, 6)
                      .map((p: any) => PLATFORM_STYLES[p.provider_id]?.name ?? p.provider_name)
                      .join(', ')}
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* ── Verdicts ─────────────────────────────────────────────────── */}
            <section>
              <SectionTitle title={`The verdicts (${totalReviews})`} align="left" />

              {totalReviews === 0 ? (
                <p className="py-12 text-center text-[16px]" style={{ color: '#555' }}>No reviews synced yet.</p>
              ) : (
                <div className="mt-8">
                  {reviews!.map((review) => {
                    const snippet = isUsefulSnippet(review.snippet) ? review.snippet : null;
                    const titleQuote = isOpinionatedTitle(review.title) ? review.title : null;
                    const displayText = snippet ?? titleQuote;
                    const isRec = review.recommend === true;
                    const isPass = review.recommend === false;

                    return (
                      <article key={review.id} className="flex gap-4 py-6" style={{ borderTop: '1px solid #E4E4E4' }}>
                        <AvatarPlain src={review.creators?.avatar_url} name={review.creators?.name || 'C'} className="w-11 h-11 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <span style={{ fontFamily: HEADLINE, fontWeight: 700, fontSize: '1.2rem', lineHeight: 1.2, color: '#111' }}>
                              {review.creators?.name}
                            </span>
                            {review.recommend !== null
                              ? <TicketStub admit={isRec} />
                              : <span className="uppercase" style={{ fontFamily: DISPLAY, fontSize: '1rem', letterSpacing: '0.06em', color: '#555' }}>Unscored</span>}
                          </div>

                          {displayText ? (
                            <p className="text-[16px] leading-relaxed line-clamp-3 max-w-[70ch] italic" style={{ fontFamily: HEADLINE, color: '#333' }}>
                              &ldquo;{displayText}&rdquo;
                            </p>
                          ) : (
                            <p className="text-[14px] italic" style={{ color: '#555' }}>Check out the full review on YouTube.</p>
                          )}

                          <a
                            href={`https://youtube.com/watch?v=${review.youtube_video_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-3 uppercase hover:underline underline-offset-4"
                            style={{ fontFamily: DISPLAY, fontSize: '1.05rem', letterSpacing: '0.06em', color: '#C8201F' }}
                          >
                            Watch on YouTube <ArrowUpRight size={13} />
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

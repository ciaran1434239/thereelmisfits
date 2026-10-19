import Link from 'next/link';
import { getLeadStory } from '@/lib/data/lead-story';
import type { ReviewDigest } from '@/lib/data/lead-story';
import type { VerdictItem } from '@/lib/data/verdicts-feed';
import { fetchPoster } from '@/lib/data/tmdb-poster';
import { VerdictCard } from '@/components/home/verdicts-wall';

const TMDB_KEY = process.env.TMDB_API_KEY;
const HEADLINE = 'var(--font-headline), Georgia, serif';

async function fetchTmdbDetails(movieId: number) {
  if (!TMDB_KEY) return null;
  return fetch(
    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_KEY}`,
    { next: { revalidate: 3600 } },
  ).then(r => (r.ok ? r.json() : null)).catch(() => null);
}

const KICKER: Record<string, string> = {
  pinned:    "Editor's pick",
  release:   'The big release',
  fight:     'Critics divided',
  consensus: 'Everyone is talking about',
};

function Quote({ review, side }: { review: ReviewDigest; side: 'pro' | 'con' }) {
  return (
    <div>
      <p className="italic text-[19px] leading-relaxed line-clamp-3" style={{ fontFamily: HEADLINE, color: '#222' }}>
        &ldquo;{review.snippet}&rdquo;
      </p>
      <p className="mt-2 uppercase" style={{ fontFamily: 'var(--font-display), Impact, sans-serif', fontSize: '1.05rem', letterSpacing: '0.06em', color: '#111' }}>
        {side === 'pro' ? 'Recommends' : 'Skips it'} <span style={{ color: '#C8201F' }}>/</span> {review.creatorName}
      </p>
    </div>
  );
}

export async function LeadStoryBlock({ justIn }: { justIn: VerdictItem[] }) {
  const story = await getLeadStory();
  const posters = new Map(
    await Promise.all(justIn.map(async v => [v.movieId, await fetchPoster(v.movieId)] as const)),
  );

  const tmdb = story ? await fetchTmdbDetails(story.movieId) : null;
  const image = tmdb?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${tmdb.backdrop_path}`
    : tmdb?.poster_path ? `https://image.tmdb.org/t/p/w780${tmdb.poster_path}` : null;
  const pro = story?.proReviews.find(r => r.snippet);
  const con = story?.conReviews.find(r => r.snippet);
  const href = story ? (`/movie/${story.movieId}` as any) : '#';

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
      {story && (
        <article className="group">
          <Link href={href} className="block overflow-hidden" style={{ background: '#E8E8E8' }}>
            <div className="relative" style={{ aspectRatio: '21/9' }}>
              {image && <img src={image} alt={story.movieTitle} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />}
            </div>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-8 mt-6">
            <div className="lg:col-span-6 flex flex-col gap-3">
              <p className="uppercase" style={{ fontFamily: 'var(--font-display), Impact, sans-serif', fontSize: '1.15rem', letterSpacing: '0.06em', color: '#111' }}>
                <span style={{ color: '#C8201F' }}>{KICKER[story.mode] ?? ''}</span> / {story.pctPositive}% of {story.reviewCount} critics recommend
              </p>
              <Link href={href}>
                <h1
                  className="hover:underline decoration-2 underline-offset-4"
                  style={{ fontFamily: HEADLINE, fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4.25rem)', lineHeight: 1.05, color: '#111' }}
                >
                  {story.headline ?? story.movieTitle}
                </h1>
              </Link>
              <Link href={href} className="self-start mt-1 text-[13px] font-bold uppercase tracking-[0.1em] hover:underline underline-offset-4" style={{ color: '#C8201F' }}>
                Read all {story.reviewCount} verdicts &rarr;
              </Link>
            </div>

            {(pro || con) && (
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
                {pro && <Quote review={pro} side="pro" />}
                {con && <Quote review={con} side="con" />}
              </div>
            )}
          </div>
        </article>
      )}

      {justIn.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-12 mt-16">
          {justIn.map(v => <VerdictCard key={v.reviewId} item={v} poster={posters.get(v.movieId) ?? null} />)}
        </div>
      )}
    </section>
  );
}

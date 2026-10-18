import Link from 'next/link';
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

const KICKER: Record<string, string> = {
  pinned:    "Editor's Pick",
  fight:     'Critics Divided',
  consensus: 'Most Talked About',
};

function Quote({ review, side }: { review: ReviewDigest; side: 'pro' | 'con' }) {
  const color = side === 'pro' ? '#1E8E3E' : '#C8201F';
  return (
    <blockquote className="pl-4" style={{ borderLeft: `3px solid ${color}` }}>
      <p
        className="text-[16px] leading-snug line-clamp-3"
        style={{ fontFamily: 'var(--font-editorial, serif)', color: '#2A2722' }}
      >
        &ldquo;{review.snippet}&rdquo;
      </p>
      <footer className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color }}>
        {side === 'pro' ? 'Recommends' : 'Skips it'} <span style={{ color: '#6B665C' }}>· {review.creatorName}</span>
      </footer>
    </blockquote>
  );
}

export async function LeadStoryBlock() {
  const story = await getLeadStory();
  if (!story) return <LeadStoryQuiet />;

  const tmdb = await fetchTmdbDetails(story.movieId);
  const image = tmdb?.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${tmdb.backdrop_path}`
    : tmdb?.poster_path ? `https://image.tmdb.org/t/p/w780${tmdb.poster_path}` : null;

  const meta = [
    tmdb?.release_date?.substring(0, 4),
    tmdb?.runtime ? `${Math.floor(tmdb.runtime / 60)}h ${tmdb.runtime % 60}m` : null,
    ...(tmdb?.genres?.slice(0, 2).map((g: { name: string }) => g.name) ?? []),
  ].filter(Boolean).join('  ·  ');

  const pro = story.proReviews.find(r => r.snippet);
  const con = story.conReviews.find(r => r.snippet);
  const href = `/movie/${story.movieId}` as any;

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">

        <Link href={href} className="lg:col-span-7 block overflow-hidden" style={{ background: '#E4DFD3' }}>
          <div style={{ aspectRatio: '16/9' }}>
            {image && <img src={image} alt={story.movieTitle} className="w-full h-full object-cover" />}
          </div>
        </Link>

        <div className="lg:col-span-5 flex flex-col gap-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: '#C8201F' }}>
            {KICKER[story.mode]}
          </p>

          <Link href={href}>
            <h1
              className="hover:underline decoration-2 underline-offset-4"
              style={{
                fontFamily: 'var(--font-editorial, serif)',
                fontWeight: 700,
                fontSize: 'clamp(2rem, 3.6vw, 3.1rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                color: '#151515',
              }}
            >
              {story.headline ?? story.movieTitle}
            </h1>
          </Link>

          {meta && <p className="text-[13px]" style={{ color: '#6B665C' }}>{meta}</p>}

          <div className="flex items-baseline gap-3">
            <span className="text-[44px] font-black leading-none tabular-nums" style={{ color: '#151515' }}>
              {story.pctPositive}%
            </span>
            <span className="text-[14px]" style={{ color: '#4A463F' }}>
              of {story.reviewCount} critics recommend it
            </span>
          </div>

          {(pro || con) && (
            <div className="flex flex-col gap-4 pt-1">
              {pro && <Quote review={pro} side="pro" />}
              {con && <Quote review={con} side="con" />}
            </div>
          )}

          <Link href={href} className="self-start text-[14px] font-bold underline underline-offset-4 decoration-2 hover:text-[#C8201F]" style={{ color: '#151515' }}>
            Read all {story.reviewCount} verdicts &rarr;
          </Link>
        </div>

      </div>
    </section>
  );
}

function LeadStoryQuiet() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center">
      <p style={{ fontFamily: 'var(--font-editorial, serif)', fontSize: '2rem', fontWeight: 700, color: '#151515' }}>
        The wall is quiet today.
      </p>
      <p className="text-[14px] mt-2" style={{ color: '#6B665C' }}>Check back when the critics are talking.</p>
    </section>
  );
}

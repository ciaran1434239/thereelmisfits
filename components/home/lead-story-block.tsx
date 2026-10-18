import Link from 'next/link';
import { getLeadStory } from '@/lib/data/lead-story';
import type { ReviewDigest } from '@/lib/data/lead-story';
import type { VerdictItem } from '@/lib/data/verdicts-feed';
import { VerdictStamp } from '@/components/ui/verdict-stamp';
import { formatDate } from '@/components/home/verdicts-wall';

const TMDB_KEY = process.env.TMDB_API_KEY;
const DISPLAY = 'var(--font-display), Impact, sans-serif';
const SERIF   = 'var(--font-editorial, serif)';

async function fetchTmdbDetails(movieId: number) {
  if (!TMDB_KEY) return null;
  return fetch(
    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_KEY}`,
    { next: { revalidate: 3600 } },
  ).then(r => (r.ok ? r.json() : null)).catch(() => null);
}

const KICKER: Record<string, string> = {
  pinned:    "Editor's pick",
  fight:     'Critics divided',
  consensus: 'Everyone is talking about',
};

function Quote({ review, side }: { review: ReviewDigest; side: 'pro' | 'con' }) {
  const color = side === 'pro' ? '#1E8E3E' : '#C8201F';
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-1.5" style={{ color }}>
        {side === 'pro' ? 'Recommends' : 'Skips it'} · {review.creatorName}
      </p>
      <p className="text-[18px] leading-snug line-clamp-3" style={{ fontFamily: SERIF, color: '#2E2A24' }}>
        &ldquo;{review.snippet}&rdquo;
      </p>
    </div>
  );
}

function JustIn({ items }: { items: VerdictItem[] }) {
  return (
    <aside className="flex flex-col">
      <h2 style={{ fontFamily: DISPLAY, fontSize: '2.5rem', lineHeight: 0.9, color: '#151515' }}>
        Just in<span style={{ color: '#C8201F' }}>.</span>
      </h2>
      <div className="mt-4 flex flex-col">
        {items.map(v => (
          <Link
            key={v.reviewId}
            href={`/movie/${v.movieId}` as any}
            className="group/card flex gap-3 py-4 hover:text-[#C8201F] transition-colors"
            style={{ borderTop: '1px solid rgba(21,21,21,0.15)', color: '#151515' }}
          >
            {v.youtubeVideoId && (
              <img
                src={`https://i.ytimg.com/vi/${v.youtubeVideoId}/mqdefault.jpg`}
                alt=""
                className="w-[104px] shrink-0 object-cover self-start grayscale-[0.85] brightness-[0.85] group-hover/card:grayscale-0 group-hover/card:brightness-100 transition duration-200"
                style={{ aspectRatio: '16/9' }}
              />
            )}
            <div className="min-w-0 flex flex-col gap-1">
              <p className="line-clamp-2" style={{ fontFamily: DISPLAY, fontSize: '1.45rem', lineHeight: 0.95, color: 'inherit' }}>{v.movieTitle}</p>
              <VerdictStamp recommend={v.recommend} size="sm" />
              <p className="text-[12px]" style={{ color: '#5F5A50' }}>{v.creatorName} · {formatDate(v.postedAt)}</p>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}

export async function LeadStoryBlock({ justIn }: { justIn: VerdictItem[] }) {
  const story = await getLeadStory();
  if (!story) {
    return (
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <p style={{ fontFamily: DISPLAY, fontSize: '4rem', lineHeight: 0.9, color: '#151515' }}>The wall is quiet today.</p>
      </section>
    );
  }

  const tmdb = await fetchTmdbDetails(story.movieId);
  const image = tmdb?.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${tmdb.backdrop_path}`
    : tmdb?.poster_path ? `https://image.tmdb.org/t/p/w780${tmdb.poster_path}` : null;

  const pro = story.proReviews.find(r => r.snippet);
  const con = story.conReviews.find(r => r.snippet);
  const href = `/movie/${story.movieId}` as any;

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-10">

        <div className="lg:col-span-8">
          <Link href={href} className="group relative block overflow-hidden" style={{ background: '#151515' }}>
            <div style={{ aspectRatio: '16/9' }}>
              {image && <img src={image} alt={story.movieTitle} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />}
            </div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' }} />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] mb-2" style={{ color: '#F2C94C' }}>
                {KICKER[story.mode]} · {story.pctPositive}% of {story.reviewCount} critics recommend
              </p>
              <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(3.25rem, 8vw, 7rem)', lineHeight: 0.85, letterSpacing: '0.005em', color: '#fff' }}>
                {story.headline ?? story.movieTitle}
              </h1>
            </div>
          </Link>

          {(pro || con) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 mt-6">
              {pro && <Quote review={pro} side="pro" />}
              {con && <Quote review={con} side="con" />}
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <JustIn items={justIn} />
        </div>

      </div>
    </section>
  );
}

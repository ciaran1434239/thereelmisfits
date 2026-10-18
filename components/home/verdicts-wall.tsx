import Link from 'next/link';
import { VerdictStamp } from '@/components/ui/verdict-stamp';
import { YTThumb }      from '@/components/ui/yt-thumb';
import { fetchPoster }  from '@/lib/data/tmdb-poster';
import type { VerdictItem } from '@/lib/data/verdicts-feed';

const DISPLAY = 'var(--font-display), Impact, sans-serif';
const SERIF   = 'var(--font-editorial, serif)';

export function formatDate(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function quoteOf(item: VerdictItem, max = 160): string | null {
  const t = item.verdictShort ?? item.snippet;
  if (!t) return null;
  return t.length > max ? t.slice(0, max).trimEnd() + '…' : t;
}

function CriticLine({ item }: { item: VerdictItem }) {
  return (
    <p className="text-[12px]" style={{ color: '#5F5A50' }}>
      <span className="font-bold" style={{ color: '#151515' }}>{item.creatorName}</span> · {formatDate(item.postedAt)}
    </p>
  );
}

function ThumbTile({ item, poster, big }: { item: VerdictItem; poster: string | null; big?: boolean }) {
  const quote = quoteOf(item, big ? 220 : 110);
  return (
    <article className="group/card flex flex-col gap-3">
      {item.youtubeVideoId
        ? <YTThumb videoId={item.youtubeVideoId} title={item.movieTitle} poster={poster} avatar={item.creatorAvatarUrl} critic={item.creatorName} />
        : <div style={{ aspectRatio: '16/9', background: '#DDD6C6' }} />}
      <div className="flex flex-col gap-1.5">
        <Link href={`/movie/${item.movieId}` as any} className="hover:text-[#C8201F] transition-colors" style={{ color: '#151515' }}>
          <h3
            className="line-clamp-2"
            style={{ fontFamily: DISPLAY, fontSize: big ? 'clamp(2.25rem,4vw,3.25rem)' : '1.9rem', lineHeight: 0.95, color: 'inherit' }}
          >
            {item.movieTitle}
          </h3>
        </Link>
        <VerdictStamp recommend={item.recommend} size="sm" />
        {quote && (
          <p className={`leading-snug ${big ? 'text-[17px] line-clamp-4' : 'text-[14px] line-clamp-3'}`} style={{ fontFamily: SERIF, color: '#2E2A24' }}>
            &ldquo;{quote}&rdquo;
          </p>
        )}
        <CriticLine item={item} />
      </div>
    </article>
  );
}

function QuoteTile({ item }: { item: VerdictItem }) {
  const yes = item.recommend;
  const accent = yes ? '#B8860B' : '#C8201F';
  const quote = quoteOf(item, 120) ?? item.movieTitle;
  return (
    <Link
      href={`/movie/${item.movieId}` as any}
      className="relative flex flex-col justify-end gap-4 px-5 pb-5 pt-14 min-h-[260px] transition-transform duration-150 hover:-rotate-1"
      style={{ background: yes ? 'rgba(212,160,23,0.14)' : 'rgba(200,32,31,0.07)', color: '#151515' }}
    >
      <span
        aria-hidden
        className="absolute left-4 top-0 select-none"
        style={{ fontFamily: DISPLAY, fontSize: '8rem', lineHeight: 1, color: accent, transform: 'translateY(-0.12em)' }}
      >
        &ldquo;
      </span>
      <p className="line-clamp-6" style={{ fontFamily: DISPLAY, fontSize: 'clamp(1.7rem, 2.2vw, 2.1rem)', lineHeight: 1.0, letterSpacing: '0.01em' }}>
        {quote}
      </p>
      <p className="text-[12px] font-bold" style={{ color: accent }}>
        {yes ? 'Recommends' : 'Skips it'} <span className="font-normal" style={{ color: '#5F5A50' }}>· {item.creatorName} on {item.movieTitle}</span>
      </p>
    </Link>
  );
}

// Repeating 9-tile pattern: feature(2 rows) + 2 thumbs / 2 quotes / 4 thumbs
const PATTERN = ['feature', 'thumb', 'thumb', 'quote', 'quote', 'thumb', 'thumb', 'thumb', 'thumb'] as const;

export async function VerdictsWall({ items }: { items: VerdictItem[] }) {
  if (items.length === 0) {
    return (
      <div className="py-20">
        <p style={{ fontFamily: DISPLAY, fontSize: '3rem', lineHeight: 1, color: '#151515' }}>Nothing here yet.</p>
        <p className="text-[14px] mt-2" style={{ color: '#5F5A50' }}>The critics haven&apos;t weighed in. Check back soon.</p>
      </div>
    );
  }

  const ids = [...new Set(items.map(v => v.movieId))];
  const posters = new Map(await Promise.all(ids.map(async id => [id, await fetchPoster(id)] as const)));

  return (
    <div className="grid grid-cols-12 gap-x-6 gap-y-10">
      {items.map((item, i) => {
        const kind = PATTERN[i % PATTERN.length];
        const poster = posters.get(item.movieId) ?? null;
        const span =
          kind === 'feature' ? 'col-span-12 md:col-span-6 md:row-span-2' :
          'col-span-12 sm:col-span-6 md:col-span-3';
        return (
          <div key={item.reviewId} className={span}>
            {kind === 'quote'
              ? <QuoteTile item={item} />
              : <ThumbTile item={item} poster={poster} big={kind === 'feature'} />}
          </div>
        );
      })}
    </div>
  );
}

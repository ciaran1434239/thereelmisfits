import Link from 'next/link';
import { VerdictStamp } from '@/components/ui/verdict-stamp';
import { YTThumb }      from '@/components/ui/yt-thumb';
import { getVerdictsFeed } from '@/lib/data/verdicts-feed';

const TMDB_KEY = process.env.TMDB_API_KEY;

async function fetchPoster(id: number): Promise<string | null> {
  if (!TMDB_KEY) return null;
  const d = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`, { next: { revalidate: 3600 } })
    .then(r => (r.ok ? r.json() : null)).catch(() => null);
  return d?.poster_path ? `https://image.tmdb.org/t/p/w154${d.poster_path}` : null;
}
import type { VerdictItem, VerdictFilter } from '@/lib/data/verdicts-feed';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) return <img src={src} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />;
  return (
    <span className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white" style={{ background: '#C8201F' }}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function VerdictCard({ item, poster }: { item: VerdictItem; poster: string | null }) {
  const text = item.verdictShort
    ?? (item.snippet ? item.snippet.slice(0, 180) + (item.snippet.length > 180 ? '…' : '') : null);

  return (
    <article className="group/card flex flex-col bg-white transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-[#151515] hover:shadow-[5px_5px_0_0_#C8201F]" style={{ border: '1px solid #151515' }}>
      {item.youtubeVideoId ? (
        <YTThumb videoId={item.youtubeVideoId} title={item.movieTitle} poster={poster} />
      ) : (
        <div style={{ aspectRatio: '16/9', background: '#E4DFD3' }} />
      )}

      <div className="flex flex-col flex-1 p-4 gap-2">
        <Link href={`/movie/${item.movieId}` as any} className="hover:underline underline-offset-2">
          <h3
            className="text-[19px] leading-tight line-clamp-1"
            style={{ fontFamily: 'var(--font-editorial, serif)', fontWeight: 700, color: '#151515' }}
          >
            {item.movieTitle}
          </h3>
        </Link>

        <div className="flex items-center gap-3">
          <VerdictStamp recommend={item.recommend} size="sm" />
          {item.score != null && item.score > 0 && (
            <span className="text-[12px] font-bold tabular-nums" style={{ color: '#6B665C' }}>
              {item.score % 1 === 0 ? item.score.toFixed(0) : item.score.toFixed(1)}/10
            </span>
          )}
        </div>

        {text && (
          <p
            className="text-[14px] leading-relaxed line-clamp-3"
            style={{ fontFamily: 'var(--font-editorial, serif)', color: '#3A362F' }}
          >
            &ldquo;{text}&rdquo;
          </p>
        )}

        <div className="flex items-center gap-2 mt-auto pt-3" style={{ borderTop: '1px solid #ECE8DE' }}>
          <Avatar src={item.creatorAvatarUrl} name={item.creatorName} />
          {item.creatorHandle ? (
            <Link href={`/channel/${item.creatorHandle}` as any} className="text-[12px] font-bold line-clamp-1 hover:underline" style={{ color: '#151515' }}>
              {item.creatorName}
            </Link>
          ) : (
            <span className="text-[12px] font-bold line-clamp-1" style={{ color: '#151515' }}>{item.creatorName}</span>
          )}
          <time dateTime={item.postedAt} className="ml-auto text-[12px] shrink-0" style={{ color: '#5F5A50' }}>
            {formatDate(item.postedAt)}
          </time>
        </div>
      </div>
    </article>
  );
}

export async function VerdictsWall({ filter = 'all' }: { filter?: VerdictFilter }) {
  const verdicts = await getVerdictsFeed(filter, 24);

  if (verdicts.length === 0) {
    return (
      <div className="py-20 text-center">
        <p style={{ fontFamily: 'var(--font-editorial, serif)', fontSize: '1.5rem', fontWeight: 700, color: '#151515' }}>
          Nothing here yet.
        </p>
        <p className="text-[14px] mt-2" style={{ color: '#6B665C' }}>The critics haven&apos;t weighed in. Check back soon.</p>
      </div>
    );
  }

  const ids = [...new Set(verdicts.map(v => v.movieId))];
  const posters = new Map(await Promise.all(ids.map(async id => [id, await fetchPoster(id)] as const)));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {verdicts.map(item => <VerdictCard key={item.reviewId} item={item} poster={posters.get(item.movieId) ?? null} />)}
    </div>
  );
}

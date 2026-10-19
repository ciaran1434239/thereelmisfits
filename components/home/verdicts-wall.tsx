import { StoryCard } from '@/components/home/story-card';
import { fetchPoster } from '@/lib/data/tmdb-poster';
import type { VerdictItem } from '@/lib/data/verdicts-feed';

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

export function VerdictCard({ item, poster, size = 'md' }: { item: VerdictItem; poster: string | null; size?: 'lg' | 'md' }) {
  // One rule for every card: the label is the consensus verdict, the grey line is who + how many.
  const good = item.scoredCount ? item.recCount / item.scoredCount >= 0.5 : item.recommend;
  return (
    <StoryCard
      size={size}
      href={`/movie/${item.movieId}`}
      image={item.youtubeVideoId ? `https://i.ytimg.com/vi/${item.youtubeVideoId}/${size === 'lg' ? 'hqdefault' : 'mqdefault'}.jpg` : null}
      title={item.movieTitle}
      quote={quoteOf(item, size === 'lg' ? 200 : 140)}
      label={good ? 'Recommends' : 'Skips it'}
      meta={`${item.creatorName} · ${item.criticCount} ${item.criticCount === 1 ? 'review' : 'reviews'}`}
      poster={poster}
      verdict={good}
    />
  );
}

export async function VerdictsWall({ items }: { items: VerdictItem[] }) {
  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p style={{ fontFamily: 'var(--font-headline), Georgia, serif', fontSize: '2rem', fontWeight: 600, color: '#111' }}>Nothing here yet.</p>
        <p className="text-[15px] mt-2" style={{ color: '#555' }}>The critics haven&apos;t weighed in. Check back soon.</p>
      </div>
    );
  }

  // Always fill complete rows of three.
  if (items.length >= 3) items = items.slice(0, Math.floor(items.length / 3) * 3);

  const ids = [...new Set(items.map(v => v.movieId))];
  const posters = new Map(await Promise.all(ids.map(async id => [id, await fetchPoster(id)] as const)));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
      {items.map(item => <VerdictCard key={item.reviewId} item={item} poster={posters.get(item.movieId) ?? null} />)}
    </div>
  );
}

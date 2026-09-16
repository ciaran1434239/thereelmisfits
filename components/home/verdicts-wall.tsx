import Link from 'next/link';
import { AvatarImg }    from '@/components/ui/avatar-img';
import { VerdictStamp } from '@/components/ui/verdict-stamp';
import { YTThumb }      from '@/components/ui/yt-thumb';
import { getVerdictsFeed } from '@/lib/data/verdicts-feed';
import type { VerdictItem, VerdictFilter } from '@/lib/data/verdicts-feed';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return `${diff}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function VerdictCard({ item }: { item: VerdictItem }) {
  const displayText = item.verdictShort
    ?? (item.snippet ? item.snippet.slice(0, 160) + (item.snippet.length > 160 ? '…' : '') : null);
  const channelHref = item.creatorHandle ? `/channel/${item.creatorHandle}` : null;

  return (
    <article
      className="flex flex-col transition-all duration-[120ms] hover:-translate-y-0.5"
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--bg-panel-edge)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        <AvatarImg
          src={item.creatorAvatarUrl}
          name={item.creatorName}
          className="w-7 h-7 shrink-0"
        />
        <div className="min-w-0 flex-1">
          {channelHref ? (
            <Link
              href={channelHref as any}
              className="text-[11px] font-black text-white hover:text-[#C8201F] transition-colors line-clamp-1 block"
            >
              {item.creatorName}
            </Link>
          ) : (
            <span className="text-[11px] font-black text-white line-clamp-1 block">{item.creatorName}</span>
          )}
        </div>
        <time
          dateTime={item.postedAt}
          className="text-[10px] shrink-0"
          style={{ color: 'var(--ink-muted)' }}
        >
          {formatDate(item.postedAt)}
        </time>
      </div>

      {/* YouTube thumbnail or placeholder */}
      {item.youtubeVideoId ? (
        <YTThumb videoId={item.youtubeVideoId} title={item.movieTitle} />
      ) : (
        <div
          className="w-full flex items-center justify-center"
          style={{ aspectRatio: '16/9', background: 'var(--bg-panel-edge)' }}
        >
          <span className="text-[28px] opacity-30">🎬</span>
        </div>
      )}

      {/* Verdict + score */}
      <div className="flex items-center gap-2 px-3 pt-2.5">
        <VerdictStamp recommend={item.recommend} size="sm" />
        {item.score != null && item.score > 0 && (
          <span className="text-[10px] font-black" style={{ color: 'var(--ink-muted)' }}>
            {item.score % 1 === 0 ? item.score.toFixed(0) : item.score.toFixed(1)}
          </span>
        )}
      </div>

      {/* Film title */}
      <Link
        href={`/movie/${item.movieId}` as any}
        className="px-3 pt-1.5 pb-0 block hover:text-[#C8201F] transition-colors"
      >
        <p className="text-[12px] font-black text-white line-clamp-1">{item.movieTitle}</p>
      </Link>

      {/* Quote */}
      {displayText && (
        <p
          className="px-3 pt-1 pb-3 text-[11px] italic leading-relaxed line-clamp-3"
          style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-editorial, serif)' }}
        >
          &ldquo;{displayText}&rdquo;
        </p>
      )}
      {!displayText && <div className="pb-3" />}
    </article>
  );
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="col-span-full flex items-center gap-3 py-2">
      <div className="flex-1 h-px" style={{ background: 'var(--bg-panel-edge)' }} />
      <span
        className="text-[10px] font-black uppercase tracking-[0.2em] px-2"
        style={{ color: 'var(--ink-muted)' }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--bg-panel-edge)' }} />
    </div>
  );
}

function groupByDay(items: VerdictItem[]): Array<{ label: string; items: VerdictItem[] }> {
  const groups: Array<{ label: string; items: VerdictItem[] }> = [];
  let currentLabel = '';

  for (const item of items) {
    const d    = new Date(item.postedAt);
    const now  = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    const label =
      diff === 0 ? 'Today' :
      diff === 1 ? 'Yesterday' :
      diff < 7   ? `${diff} days ago` :
      d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, items: [] });
    }
    groups.at(-1)!.items.push(item);
  }
  return groups;
}

export async function VerdictsWall({ filter = 'all' }: { filter?: VerdictFilter }) {
  const verdicts = await getVerdictsFeed(filter, 24);

  if (verdicts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p
          className="font-[900] uppercase italic tracking-[-0.03em]"
          style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', color: 'var(--ink-muted)' }}
        >
          Nothing here yet.
        </p>
        <p className="text-[13px] mt-2" style={{ color: 'var(--ink-muted)' }}>
          The critics haven&apos;t weighed in — check back soon.
        </p>
      </div>
    );
  }

  const groups = groupByDay(verdicts);

  return (
    <div className="flex flex-col gap-0">
      {groups.map(group => (
        <div key={group.label}>
          <DateDivider label={group.label} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.items.map(item => (
              <VerdictCard key={item.reviewId} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

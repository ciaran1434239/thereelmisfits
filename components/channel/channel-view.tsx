// components/channel/channel-view.tsx
//
// Client wrapper that bridges the server-side data load to the client-side
// tab state in ChannelTabs. Server components can't pass functions across the
// boundary, so the render-prop pattern in ChannelTabs needs a client parent.

'use client';

import Link from 'next/link';
import { ChannelTabs } from '@/components/channel/channel-tabs';
import { VideoThumb } from '@/components/ui/video-thumb';
import { Avatar } from '@/components/ui/avatar';
import { VerdictPill } from '@/components/ui/verdict-pill';
import type { Reviewer } from '@/lib/types';

type ChannelReviewRow = any;

interface ChannelViewProps {
  reviewer: Reviewer;
  videos: ChannelReviewRow[];
  recommends: ChannelReviewRow[];
  passes: ChannelReviewRow[];
}

export function ChannelView({ reviewer, videos, recommends, passes }: ChannelViewProps) {
  return (
    <ChannelTabs>
      {(tab) => {
        if (tab === 'about') return <AboutPanel reviewer={reviewer} />;
        const rows =
          tab === 'recommends' ? recommends : tab === 'passes' ? passes : videos;
        return <VideoGrid rows={rows} />;
      }}
    </ChannelTabs>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-panels                                                                */
/* -------------------------------------------------------------------------- */

function VideoGrid({ rows }: { rows: ChannelReviewRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-subtle py-12 text-center">
        Nothing here yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
      {rows.map(({ review, title }) => (
        <Link
          key={review.id}
          href={`/movie/${title.id}`}
          className="group block focus:outline-none"
        >
          <VideoThumb
            palette={title.poster}
            runtime={review.runtime}
            label={title.title}
          />
          <div className="pt-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm text-ink leading-tight line-clamp-2 group-hover:text-red transition-colors">
                {review.headline}
              </h3>
              <VerdictPill recommend={review.recommend} />
            </div>
            <div className="text-xs text-subtle">
              {title.title} ({title.year}) · {review.views} views · {review.date}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function AboutPanel({ reviewer }: { reviewer: Reviewer }) {
  return (
    <div className="max-w-2xl space-y-6">
      <section>
        <h2 className="font-display text-xl font-bold tracking-display-sm mb-2">
          About
        </h2>
        <p className="text-sm text-body leading-relaxed">{reviewer.tone}</p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold tracking-display-sm mb-3">
          Channel details
        </h2>
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <dt className="text-subtle">Handle</dt>
          <dd className="text-ink">@{reviewer.handle}</dd>

          <dt className="text-subtle">Subscribers</dt>
          <dd className="text-ink">{reviewer.subs}</dd>

          <dt className="text-subtle">Average runtime</dt>
          <dd className="text-ink">{reviewer.avgRuntime}</dd>

          <dt className="text-subtle">Verified</dt>
          <dd className="text-ink">{reviewer.verified ? 'Yes' : 'No'}</dd>
        </dl>
      </section>

      <section className="flex items-center gap-3 pt-2">
        <Avatar reviewer={reviewer} size="md" />
        <div className="text-sm text-subtle">
          Reviews on this page are scored by TheySaid editors based on the
          channel's video reviews.
        </div>
      </section>
    </div>
  );
}

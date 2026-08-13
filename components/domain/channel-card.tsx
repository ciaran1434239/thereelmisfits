// components/domain/channel-card.tsx
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Pill } from '@/components/ui/pill';
import type { Reviewer, Review } from '@/lib/types';

interface ChannelCardProps {
  reviewer: Reviewer;
  reviews: Review[];
  /** Compact variant used inside grids; expanded variant on the channels page. */
  variant?: 'compact' | 'expanded';
}

export function ChannelCard({ reviewer, reviews, variant = 'compact' }: ChannelCardProps) {
  const recCount = reviews.filter((r) => r.recommend).length;
  const recPct = reviews.length === 0 ? 0 : Math.round((recCount / reviews.length) * 100);

  if (variant === 'compact') {
    return (
      <Link
        href={`/channel/${reviewer.handle}`}
        className="bg-surface border border-border rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:border-border-hi transition-colors"
      >
        <Avatar reviewer={reviewer} size="lg" />
        <div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[14px] font-semibold text-ink">{reviewer.name}</span>
            {reviewer.verified && <Check size={11} className="text-subtle" />}
          </div>
          <div className="text-[11px] text-subtle mt-0.5">
            {reviewer.subs} subs · {recPct}% rec
          </div>
        </div>
        <p className="text-[12px] text-subtle leading-snug line-clamp-2">
          {reviewer.tone}
        </p>
      </Link>
    );
  }

  return (
    <Link
      href={`/channel/${reviewer.handle}`}
      className="bg-surface border border-border rounded-xl p-5 flex gap-4 items-center hover:border-border-hi transition-colors"
    >
      <Avatar reviewer={reviewer} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display text-xl font-bold text-ink tracking-display-sm">
            {reviewer.name}
          </span>
          {reviewer.verified && <Check size={13} className="text-subtle" />}
        </div>
        <div className="text-[13px] text-subtle mb-2">
          @{reviewer.handle} · {reviewer.subs} subscribers
        </div>
        <p className="text-[13px] text-body leading-relaxed mb-2.5">{reviewer.tone}</p>
        <div className="flex gap-1.5 flex-wrap">
          <Pill>{reviews.length} reviews</Pill>
          <Pill textClass="text-green" bgClass="bg-green-soft">{recPct}% rec</Pill>
          <Pill>{reviewer.avgRuntime} avg</Pill>
        </div>
      </div>
    </Link>
  );
}

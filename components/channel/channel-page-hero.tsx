// components/channel/channel-page-hero.tsx
import { Bell, Check } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import type { Reviewer } from '@/lib/types';

interface ChannelPageHeroProps {
  reviewer: Reviewer;
  totalReviews: number;
  recCount: number;
  avgScore: number;
}

export function ChannelPageHero({ reviewer, totalReviews, recCount, avgScore }: ChannelPageHeroProps) {
  const recPct = totalReviews === 0 ? 0 : Math.round((recCount / totalReviews) * 100);
  return (
    <>
      <div
        className="h-40 rounded-xl mx-4 sm:mx-6 mb-0 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${reviewer.color} 0%, ${reviewer.color}88 60%, ${reviewer.color}44 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
      </div>

      <div className="mx-4 sm:mx-6 py-6 flex flex-col sm:flex-row sm:items-center gap-6 border-b border-border">
        <Avatar reviewer={reviewer} size="xl" className="!w-30 !h-30" />
        <div className="flex-1">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-display-md mb-2 flex items-center gap-2">
            {reviewer.name}
            {reviewer.verified && (
              <span className="w-5.5 h-5.5 rounded-full bg-subtle inline-flex items-center justify-center">
                <Check size={12} className="text-white" strokeWidth={3} />
              </span>
            )}
          </h1>
          <div className="text-sm text-subtle mb-2 flex flex-wrap gap-3">
            <span className="text-ink font-medium">@{reviewer.handle}</span>
            <span>·</span>
            <span>{reviewer.subs} subscribers</span>
            <span>·</span>
            <span>{totalReviews} reviews</span>
            <span>·</span>
            <span>{recCount} recs ({recPct}%)</span>
            <span>·</span>
            <span>avg {avgScore.toFixed(1)}/10</span>
          </div>
          <p className="text-sm text-body m-0 max-w-2xl">{reviewer.tone}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-4.5 py-2.5 rounded-full bg-ink text-white text-sm font-semibold hover:bg-body"
          >
            Subscribe
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="px-3.5 py-2.5 rounded-full bg-surface-alt text-ink hover:bg-surface-hover"
          >
            <Bell size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

// components/title/channel-review-item.tsx
import Link from 'next/link';
import { Check, Eye, Clock, ArrowUpRight } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { VerdictPill } from '@/components/ui/verdict-pill';
import type { Review, Reviewer } from '@/lib/types';

interface ChannelReviewItemProps {
  review: Review;
  reviewer: Reviewer;
}

export function ChannelReviewItem({ review, reviewer }: ChannelReviewItemProps) {
  return (
    <article className="flex gap-3.5 py-5 border-b border-border last:border-b-0">
      <Link href={`/channel/${reviewer.handle}`} className="shrink-0">
        <Avatar reviewer={reviewer} size="md" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <Link
            href={`/channel/${reviewer.handle}`}
            className="text-[13px] font-semibold hover:underline"
          >
            @{reviewer.handle}
          </Link>
          {reviewer.verified && <Check size={11} className="text-subtle" />}
          <VerdictPill recommend={review.recommend} size="sm" />
          <span className="text-xs text-subtle">{review.date}</span>
        </div>
        <h4 className="font-display text-lg font-semibold leading-snug tracking-display-sm mb-2">
          {review.headline}
        </h4>
        <p className="text-sm text-body leading-relaxed mb-3">{review.verdict}</p>
        
        <div className="flex items-center gap-4 text-xs text-subtle">
          {/*
            Subtle text link replaces the heavy red button. 
            Blends in with the meta data but keeps an interactive hover state.
          */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-semibold text-foreground hover:text-red transition-colors"
          >
            Watch on YouTube <ArrowUpRight size={13} strokeWidth={2.5} />
          </a>
          
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Eye size={13} /> {review.views}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} /> {review.runtime}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
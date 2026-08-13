// components/title/reviews-list.tsx
'use client';

import { useState } from 'react';
import { Chip } from '@/components/ui/chip';
import { ChannelReviewItem } from './channel-review-item';
import type { Review, Reviewer, Consensus } from '@/lib/types';

interface ReviewsListProps {
  reviews: Review[];
  reviewersById: Record<string, Reviewer>;
  consensus: Consensus;
}

type FilterType = 'all' | 'rec' | 'pass';

export function ReviewsList({ reviews, reviewersById, consensus }: ReviewsListProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = reviews.filter((r) => {
    if (filter === 'rec') return r.recommend;
    if (filter === 'pass') return !r.recommend;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* 
        Redundant heading removed. 
        Filters left-aligned to sit naturally beneath the main page heading. 
      */}
      <div className="flex gap-2" role="group" aria-label="Filter reviews">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          All · {consensus.total}
        </Chip>
        <Chip active={filter === 'rec'} onClick={() => setFilter('rec')}>
          Rec · {consensus.recCount}
        </Chip>
        <Chip active={filter === 'pass'} onClick={() => setFilter('pass')}>
          Pass · {consensus.passCount}
        </Chip>
      </div>
      
      <div className="flex flex-col gap-8">
        {filtered.map((review) => {
          const reviewer = reviewersById[review.reviewerId];
          if (!reviewer) return null;
          return <ChannelReviewItem key={review.id} review={review} reviewer={reviewer} />;
        })}
      </div>
    </div>
  );
}
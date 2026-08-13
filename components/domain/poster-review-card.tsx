// components/domain/poster-review-card.tsx
//
// Film-first card. Poster (2:3) as the hero, title as the headline,
// reviewer as a byline. The opposite hierarchy from ReviewCard, which
// leads with the YouTube reviewer's video frame.
//
// Use this on home/browse where the user is asking "what films are good?"
// Use ReviewCard on channel pages where the user is asking "what does
// this person think of films?"

import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Poster } from '@/components/ui/poster';
import type { Review, Reviewer, Title } from '@/lib/types';

interface PosterReviewCardProps {
  review: Review;
  reviewer: Reviewer;
  title: Title;
}

export function PosterReviewCard({
  review,
  reviewer,
  title,
}: PosterReviewCardProps) {
  return (
    <article className="group">
      <Link href={`/movie/${title.id}`} className="block">
        <Poster
          palette={title.poster}
          posterUrl={title.posterUrl}
          label={title.title}
          recommend={review.recommend}
          score={review.score}
        />
      </Link>

      <div className="mt-2.5">
        <Link
          href={`/movie/${title.id}`}
          className="block font-semibold text-[14px] leading-snug text-ink line-clamp-2 group-hover:text-red transition-colors"
        >
          {title.title}
        </Link>
        <div className="text-[12px] text-faint mt-0.5">
          {title.year} · {title.runtime}
        </div>

        {/* One-line review voice — sliver of the actual reviewer's take */}
        {review.verdict && (
          <p className="mt-2 text-[13px] leading-snug italic text-body line-clamp-2">
            &ldquo;{review.verdict}&rdquo;
          </p>
        )}

        {/* Reviewer as byline — small, secondary */}
        <Link
          href={`/channel/${reviewer.handle}`}
          className="flex items-center gap-1.5 mt-2 text-[12px] text-subtle hover:text-ink transition-colors"
        >
          <Avatar reviewer={reviewer} size="xs" />
          <span className="truncate">{reviewer.name}</span>
        </Link>
      </div>
    </article>
  );
}

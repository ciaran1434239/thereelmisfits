import Link from 'next/link';
import { Check } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { VideoThumb } from '@/components/ui/video-thumb';
import type { Review, Reviewer, Title } from '@/lib/types';

function formatTimeAgo(dateString: string) {
  if (!dateString || dateString === 'JUST NOW') return 'JUST NOW';
  
  const date = new Date(dateString);
  const now = new Date();
  const secondsPast = (now.getTime() - date.getTime()) / 1000;

  if (secondsPast < 60) return 'JUST NOW';
  if (secondsPast < 3600) return Math.floor(secondsPast / 60) + ' MINS AGO';
  if (secondsPast <= 86400) return Math.floor(secondsPast / 3600) + ' HOURS AGO';
  return Math.floor(secondsPast / 86400) + ' DAYS AGO';
}

interface ReviewCardProps {
  review: Review;
  reviewer: Reviewer;
  title: Title;
}

export function ReviewCard({ review, reviewer, title }: ReviewCardProps) {
  return (
    <article>
      <Link href={`/movie/${title.id}`} aria-label={`${title.title} reviews`}>
        <VideoThumb
          palette={title.poster}
          runtime={review.runtime}
          recommend={review.recommend}
          score={review.score}
        />
      </Link>
      <div className="flex gap-3 mt-3">
        <Link
          href={`/channel/${reviewer.handle}`}
          aria-label={`${reviewer.name} channel`}
        >
          <Avatar reviewer={reviewer} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/movie/${title.id}`}>
            <h3 className="text-[15px] font-semibold text-ink leading-snug mb-1.5 line-clamp-2 tracking-display-sm">
              {review.headline}
            </h3>
          </Link>
          <Link
            href={`/channel/${reviewer.handle}`}
            className="text-[13px] text-subtle flex items-center gap-1"
          >
            {reviewer.name}
            {reviewer.verified && <Check size={11} className="text-subtle" />}
          </Link>
          <div className="text-[13px] text-subtle">
            on{' '}
            <Link href={`/movie/${title.id}`} className="text-ink font-medium hover:underline">
              {title.title}
            </Link>
            {' · '}
            {review.views} views · {formatTimeAgo((review as any).posted_at || review.date || '')}
          </div>
        </div>
      </div>
    </article>
  );
}
// app/score/page.tsx
//
// Score — internal tool for editors. Takes reviews where the editor hasn't
// yet assigned a score / verdict, presents them in a queue, and lets the
// editor stamp each one.
//
// Today the "save" hits a no-op mutation in the API layer; tomorrow that
// becomes a Supabase update. The UI doesn't change.
//
// Production note: this route should be protected by middleware (auth check
// against an editor role). Wiring that up is left for the auth pass — see
// the README "Auth" section.

import type { Metadata } from 'next';
import {
  listReviewers,
  listTitles,
  listReviewsForTitle,
} from '@/lib/api';
import type { Review, Reviewer, Title } from '@/lib/types';
import { ScoreQueue } from '@/components/admin/score-queue';

export const metadata: Metadata = {
  title: 'Score · The Reel Misfits Admin',
  // No-index — this is internal.
  robots: { index: false, follow: false },
};

export interface ScoreQueueItem {
  review: Review;
  title: Title;
  reviewer: Reviewer;
}

export default async function ScorePage() {
  const [titles, reviewers] = await Promise.all([listTitles(), listReviewers()]);
  const reviewerById = new Map(reviewers.map((r) => [r.id, r]));

  // Pull every review and attach its title + reviewer for display.
  const allReviews = await Promise.all(
    titles.map(async (title) => {
      const reviews = await listReviewsForTitle(title.id);
      return reviews.map((review) => {
        const reviewer = reviewerById.get(review.reviewerId);
        if (!reviewer) return null;
        return { review, title, reviewer } satisfies ScoreQueueItem;
      });
    })
  );

  const queue: ScoreQueueItem[] = allReviews
    .flat()
    .filter((item): item is ScoreQueueItem => item !== null)
    // Most recent first — editors typically want to score new uploads.
    .sort((a, b) => b.review.date.localeCompare(a.review.date));

  return (
    <div className="px-4 sm:px-6 py-5 max-w-[1280px] mx-auto">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block px-2 py-0.5 rounded bg-ink text-white text-[10px] font-bold uppercase tracking-wider">
            Internal
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-display-md">
            Score queue
          </h1>
        </div>
        <p className="text-sm text-subtle">
          {queue.length} {queue.length === 1 ? 'review' : 'reviews'} in queue.
          Assign a score (0–10) and a recommend / pass verdict for each.
        </p>
      </header>

      <ScoreQueue items={queue} />
    </div>
  );
}

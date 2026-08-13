// app/score/actions.ts
//
// Server actions for the editor scoring workflow.
//
// In v0.2 these are no-op stubs — the data layer is mock JSON, so a "save"
// has nowhere to land. The action shape is what matters: when the backend
// arrives, the only change is the body of `saveReviewScore` (swap the
// console.log for an `await db.review.update(...)` or Supabase call).
//
// Keeping the action server-side, even as a stub, gives us:
//   1. A single chokepoint for auth checks once they exist (see README).
//   2. Type-safe boundary between the client UI and persistence.
//   3. No client-side import of the (eventual) database client.

'use server';

export interface SaveReviewScoreInput {
  reviewId: string;
  score: number;
  recommend: boolean;
}

/**
 * Persist an editor's score + verdict for a review.
 *
 * @throws if `score` is outside 0–10. The client validates this too, but the
 *         server is the source of truth — never trust the client.
 */
export async function saveReviewScore(input: SaveReviewScoreInput): Promise<void> {
  const { reviewId, score, recommend } = input;

  if (!Number.isFinite(score) || score < 0 || score > 10) {
    throw new Error(`Invalid score ${score} — must be between 0 and 10.`);
  }
  if (!reviewId) {
    throw new Error('Missing reviewId.');
  }

  // TODO: replace with real persistence once the DB is wired.
  // Example:
  //   await db.review.update({
  //     where: { id: reviewId },
  //     data: { score, recommend, scoredAt: new Date() },
  //   });
  //   revalidatePath('/score');
  //   revalidatePath(`/movie/${titleId}`);  // recompute consensus
  console.log('[score] saveReviewScore (stub)', { reviewId, score, recommend });

  // Tiny delay so the UI's "Saving" state is visible during local dev.
  // Remove this when wiring the real backend.
  await new Promise((r) => setTimeout(r, 200));
}

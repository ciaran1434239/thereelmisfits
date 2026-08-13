// lib/utils/consensus.ts
import type { Review, Consensus, Verdict } from '@/lib/types';
import { CONSENSUS_THRESHOLDS, MIN_REVIEWS_FOR_VERDICT } from './consensus-config';

/**
 * Computes the consensus for a list of reviews.
 *
 * Returns null values for empty lists rather than throwing — the UI uses these
 * as "No Verdict" rather than crashing on titles without reviews yet.
 */
export function computeConsensus(reviews: Review[]): Consensus {
  if (reviews.length === 0) {
    return { score: null, recPct: null, recCount: 0, passCount: 0, total: 0 };
  }

  const recCount = reviews.filter((r) => r.recommend).length;
  const passCount = reviews.length - recCount;
  const recPct = Math.round((recCount / reviews.length) * 100);
  const avgScore = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;

  return {
    // Score is 0-100 (the average score on a 0-10 scale, scaled up).
    score: Math.round(avgScore * 10),
    recPct,
    recCount,
    passCount,
    total: reviews.length,
  };
}

/**
 * Maps a consensus to a verdict label and tone.
 * The thresholds live in consensus-config.ts so they're easy to adjust.
 */
export function getVerdict(consensus: Consensus): Verdict {
  if (consensus.recPct === null || consensus.total < MIN_REVIEWS_FOR_VERDICT) {
    return { label: 'No Verdict', tone: 'faint' };
  }
  if (consensus.recPct >= CONSENSUS_THRESHOLDS.recommend) {
    return { label: 'Recommend', tone: 'green' };
  }
  if (consensus.recPct >= CONSENSUS_THRESHOLDS.okay) {
    return { label: 'Okay', tone: 'gold' };
  }
  return { label: 'Pass', tone: 'red' };
}

/**
 * Convenience: does this title clear the "Recommend" bar?
 * Used by featured-title selection and certain filter/sort operations.
 */
export function isRecommended(consensus: Consensus): boolean {
  return (
    consensus.recPct !== null &&
    consensus.total >= MIN_REVIEWS_FOR_VERDICT &&
    consensus.recPct >= CONSENSUS_THRESHOLDS.recommend
  );
}

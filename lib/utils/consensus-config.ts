// lib/utils/consensus-config.ts
//
// The Consensus Engine — TheySaid's core business rule.
//
// The site uses a binary "Recommend / Pass" model on individual reviews.
// The headline number on every title is the percentage of channels that
// recommended it (the "rec %"). This is the same model Rotten Tomatoes uses
// for its Tomatometer — and crucially, it is NOT an average of numeric scores.
//
// A title with all 6/10 reviews scores 100% rec, even though the average is 60%.
// That is the intended behaviour. The consensus is a vote, not an average.
//
// The numeric average score is shown as a secondary signal for users who want
// to distinguish a unanimous-but-tepid 65% from an enthusiastic 65%.

// Three-tier verdict system (mirrors Rotten Tomatoes' Fresh / Rotten model
// but adds a meaningful middle ground):
//
//  🟢 Recommend  ≥70%  — the creator web says "go watch this"
//  🟡 Okay       ≥40%  — fine, but maybe wait for streaming
//  🔴 Pass       ≤39%  — consensus rejection
//
// Individual reviews remain binary (thumbs up / thumbs down).
// These thresholds only govern the AGGREGATE display badge.

export const CONSENSUS_THRESHOLDS = {
  /** ≥75% → Recommend (green) */
  recommend: 75,
  /** ≥50% → Okay / Mixed (amber) */
  okay: 50,
  // below okay → Pass (red)
} as const;

/**
 * Minimum scored reviews before a verdict badge is shown at all.
 * Prevents one outlier from giving an obscure film a 100% badge.
 */
export const MIN_REVIEWS_FOR_VERDICT = 3;

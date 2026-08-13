// lib/utils/score-tier.ts
//
// Single source of truth for the 3-tier score colour system.
// Import from here — never hardcode thresholds or colour classes in components.
//
//  🟢 Recommend  ≥75%   green bg, white text
//  🟡 Okay       51–74%  yellow bg (#FFC107), dark text (#1A1A1A) — yellow fails WCAG with white
//  🔴 Pass       ≤50%   red bg, white text

import { CONSENSUS_THRESHOLDS } from './consensus-config';

export type ScoreTier = 'recommend' | 'okay' | 'pass';

export function getScoreTier(pct: number): ScoreTier {
  if (pct >= CONSENSUS_THRESHOLDS.recommend) return 'recommend';
  if (pct >= CONSENSUS_THRESHOLDS.okay) return 'okay';
  return 'pass';
}

// Thresholds: 75–100 = green (Recommend), 50–74 = amber (Okay), 0–49 = red (Pass)

// ── Solid tile (the headline score block on a movie/show page) ────────────────
// Returns BOTH background AND text colour — always use tileClasses(), not tileBg(),
// so the dark-text rule for the yellow tier is never forgotten.

export const TILE_CLASSES: Record<ScoreTier, string> = {
  recommend: 'bg-[#2BA640] text-white',
  okay:      'bg-[#D97706] text-white',
  pass:      'bg-[#E21D1D] text-white',
};

/** Full tile classes (bg + text) for the headline score block. */
export function tileClasses(pct: number): string {
  return TILE_CLASSES[getScoreTier(pct)];
}

// ── Solid badge (small chip overlaid on a poster image) ───────────────────────
// Angled right edge (play-button chevron) makes this distinctly TheySaid,
// not a generic coloured rectangle. The clip-path cuts the bottom-right corner.
// Extra right padding (pr-3.5) compensates for the angled cut.

// Badge: solid fill, white text — reads clearly on both posters and light page background.
export const BADGE_BG = 'rounded';

/** Standard badge padding + weight. Apply alongside badgeClasses(). */
export const BADGE_SIZE = 'text-[0.75rem] font-[800] px-2 py-[3px]';

export const BADGE_CLASSES: Record<ScoreTier, string> = {
  recommend: 'bg-[#16A34A] text-white rounded',
  okay:      'bg-[#D97706] text-white rounded',
  pass:      'bg-[#C8201F] text-white rounded',
};

/** Badge classes for poster score chips — solid fill, white text. */
export function badgeClasses(pct: number): string {
  return BADGE_CLASSES[getScoreTier(pct)];
}

/** Consistent UNSCORED pill — same shape as score badge, muted. */
export const UNSCORED_BADGE = 'bg-black/40 text-white/60 rounded';

/** Standardised rank number pill — dark, works on any poster. */
export const RANK_PILL = 'absolute top-1.5 left-1.5 z-10 bg-black/55 text-white text-[11px] font-black px-1.5 py-0.5 rounded-full leading-none backdrop-blur-sm';

// ── Subtle tinted pill (chart lists, inline score pills) ─────────────────────

export const PILL_CLS: Record<ScoreTier, string> = {
  recommend: 'bg-[#2BA640] text-white',
  okay:      'bg-[#FFC107] text-[#1A1A1A]',
  pass:      'bg-[#E21D1D] text-white',
};

/** Pill classes for chart-list and inline score displays. */
export function pillCls(pct: number): string {
  return PILL_CLS[getScoreTier(pct)];
}

// ── Legacy convenience helpers (kept for bar/graph uses that only need bg) ────
/** @deprecated Use tileClasses() instead — this omits the text colour. */
export function tileBg(pct: number): string {
  return TILE_CLASSES[getScoreTier(pct)].split(' ')[0]!;
}
/** @deprecated Use badgeClasses() instead — this omits the text colour. */
export function badgeBg(pct: number): string {
  return BADGE_CLASSES[getScoreTier(pct)].split(' ')[0]!;
}

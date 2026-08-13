// lib/utils/format.ts

/**
 * Format a dollar amount as a compact currency string.
 * 28_400_000 → "$28.4M"
 * 1_240_000_000 → "$1.24B"
 */
export function fmtMoney(n: number): string {
  if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + n;
}

/** Produce initials for an avatar — first letters of the first two words. */
export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Linear interpolation between three hex colors used for poster gradients. */
export function posterGradient(palette: [string, string, string]): string {
  const [c1, c2, c3] = palette;
  return `linear-gradient(135deg, ${c1} 0%, ${c2} 60%, ${c3} 100%)`;
}

/**
 * Pick the darkest of the three colors in a poster palette. Used for the
 * ambient hero glow — the darkest hex makes a richer, less washed-out
 * radial when applied at low opacity behind the hero card.
 *
 * "Darkest" = lowest perceived luma (Rec. 709 weights).
 */
export function darkestOfPalette(palette: [string, string, string]): string {
  let darkest = palette[0];
  let darkestLuma = luma(darkest);
  for (let i = 1; i < palette.length; i++) {
    const candidate = palette[i]!;
    const candidateLuma = luma(candidate);
    if (candidateLuma < darkestLuma) {
      darkest = candidate;
      darkestLuma = candidateLuma;
    }
  }
  return darkest;
}

/** Perceived brightness of a #RRGGBB hex string, 0..255. */
function luma(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Rec. 709 luma — matches how the eye perceives brightness across channels.
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

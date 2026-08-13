// components/layout/wordmark.tsx
//
// Wordmark for "TheySaid". Pure typography — no symbol — in the
// publication-masthead tradition (The Atlantic, The New Yorker, The
// Athletic). The name is already a quotation, so adding a quote-mark
// glyph beside it would be redundant. The type carries the brand alone.
//
// Treatment:
//   • Serif typeface (Georgia stack — placeholder; a real licensed display
//     serif like GT Sectra or Tiempos would be the upgrade path).
//   • Heavy weight, tight tracking — masthead feel, not body copy.
//   • CamelCase break (TheySaid) is the visual hinge. The capital S
//     does the work a logo symbol would otherwise do.
//   • Subtle red period after the wordmark — a nod to "TheySaid." as a
//     declaration, and a single accent of brand colour without putting
//     the whole wordmark in red.
//
// Sizing: the wordmark targets ~24px tall in the header. The period is
// proportional and inherits brand red.
//
// To swap brand: change SITE_NAME in lib/brand.ts. To change the visual
// treatment, edit this file alone.

import Link from 'next/link';
import { SITE_NAME } from '@/lib/brand';

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={className}
      aria-label={`${SITE_NAME} home`}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        textDecoration: 'none',
        // Use baseline alignment so the period sits where it should
        // visually rather than vertically centred.
      }}
    >
      <span
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '22px',
          fontWeight: 700,
          letterSpacing: '-0.015em',
          lineHeight: 1,
          color: 'inherit', // inherits text-ink from header
        }}
      >
        {SITE_NAME}
      </span>
      <span
        aria-hidden="true"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '22px',
          fontWeight: 700,
          lineHeight: 1,
          // Brand red — now the global token (`#C8201F`, stamp-ink).
          // Inherits any future palette change automatically.
          color: '#C8201F',
          marginLeft: '1px',
        }}
      >
        .
      </span>
    </Link>
  );
}

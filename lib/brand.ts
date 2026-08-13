// lib/brand.ts
//
// Single source of truth for the site's brand name. Imported by metadata,
// page titles, structured data, and the wordmark. Update here when the
// final brand name lands.
//
// Note: the visual wordmark (logo + name) lives in components/layout/wordmark.tsx
// — it imports SITE_NAME from here so the two stay in sync.

/** Public-facing site name. */
export const SITE_NAME = 'The Reel Misfits';

/** Short tagline used in OG cards and the root <title>. */
export const SITE_TAGLINE =
  'YouTube film criticism, aggregated.';

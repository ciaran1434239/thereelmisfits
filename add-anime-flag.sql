-- Add is_anime flag to shows table
-- Run this when adding anime creators to the sync pipeline.
-- The flag lets the sync tag shows at insert time so the
-- /anime page and metadata swaps can query it efficiently.

ALTER TABLE shows
  ADD COLUMN IF NOT EXISTS is_anime boolean NOT NULL DEFAULT false;

-- Backfill existing anime shows via their TMDB genre (done externally via TMDB API)
-- After adding creators, re-run deep-sync — new shows will be tagged automatically.

-- Optional: index for fast anime-only queries
CREATE INDEX IF NOT EXISTS idx_shows_is_anime ON shows (is_anime) WHERE is_anime = true;

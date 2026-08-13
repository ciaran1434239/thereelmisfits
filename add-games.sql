-- ── Games table ──────────────────────────────────────────────────────────────
-- Stores IGDB metadata cached at sync time so the browse/detail pages
-- don't need to hit IGDB on every page load.

CREATE TABLE IF NOT EXISTS games (
  id                 bigint      PRIMARY KEY,  -- IGDB game ID
  title              text        NOT NULL,
  slug               text,
  cover_image_id     text,                     -- IGDB image_id → t_cover_big_2x (2:3)
  hero_image_id      text,                     -- IGDB artwork or screenshot → t_1080p (16:9)
  first_release_date bigint,                   -- Unix timestamp (IGDB format)
  summary            text,
  created_at         timestamptz DEFAULT now()
);

-- ── Add game_id to reviews ────────────────────────────────────────────────────
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS game_id bigint REFERENCES games(id);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reviews_game_id
  ON reviews(game_id) WHERE game_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_games_slug
  ON games(slug);

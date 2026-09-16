-- Homepage Rebuild: Verdicts Wall
-- Run once in the Supabase SQL editor.

-- § 1.1  Add poster_path and release_date to movies (additive — no data loss)
ALTER TABLE movies ADD COLUMN IF NOT EXISTS poster_path  text;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS release_date date;

-- § 1.2  Add verdict_short to reviews (short pull-quote, nullable)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verdict_short text;

-- § 1.3  Editorial pins table (singleton row, id = 1 enforced)
CREATE TABLE IF NOT EXISTS editorial_pins (
  id           int  PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  movie_id     int  REFERENCES movies(id) ON DELETE SET NULL,
  headline     text,
  pinned_until timestamptz,
  updated_at   timestamptz DEFAULT now()
);

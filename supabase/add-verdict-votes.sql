-- Stores individual votes for the Divided Verdict "Who do you back?" feature.
-- Each row = one vote. Counts are aggregated at query time.
-- No auth required — votes are public and anonymous.

CREATE TABLE IF NOT EXISTS verdict_votes (
  id         bigserial PRIMARY KEY,
  movie_id   int       NOT NULL,
  side       text      NOT NULL CHECK (side IN ('pro', 'con')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS verdict_votes_movie_id_idx ON verdict_votes (movie_id);

-- Allow anonymous reads and inserts (RLS must be enabled on the table for these policies to apply)
ALTER TABLE verdict_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read verdict_votes"
  ON verdict_votes FOR SELECT USING (true);

CREATE POLICY "anyone can insert verdict_votes"
  ON verdict_votes FOR INSERT WITH CHECK (true);

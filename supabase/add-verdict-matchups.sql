-- Tracks every unique critic-pairing shown in the Divided Verdict section.
-- One row per (movie, pro_creator, con_creator) trio.
-- Used to compute W/L standings in the Critic League Table.

CREATE TABLE IF NOT EXISTS verdict_matchups (
  id              bigserial    PRIMARY KEY,
  movie_id        int          NOT NULL,
  pro_creator_id  text         NOT NULL,   -- creator.id (UUID stored as text)
  con_creator_id  text         NOT NULL,
  first_seen      timestamptz  DEFAULT now(),
  last_seen       timestamptz  DEFAULT now(),
  CONSTRAINT verdict_matchups_unique UNIQUE (movie_id, pro_creator_id, con_creator_id)
);

CREATE INDEX IF NOT EXISTS verdict_matchups_pro_idx ON verdict_matchups (pro_creator_id);
CREATE INDEX IF NOT EXISTS verdict_matchups_con_idx ON verdict_matchups (con_creator_id);

-- Allow anon reads (standings computation) and upserts (spotlight recording)
ALTER TABLE verdict_matchups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read verdict_matchups"
  ON verdict_matchups FOR SELECT USING (true);

CREATE POLICY "anyone can insert verdict_matchups"
  ON verdict_matchups FOR INSERT WITH CHECK (true);

CREATE POLICY "anyone can update verdict_matchups"
  ON verdict_matchups FOR UPDATE USING (true);

-- Also ensure verdict_votes allows SELECT (needed for standings)
-- (No-op if the policy already exists from add-verdict-votes.sql)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'verdict_votes'
      AND policyname = 'anyone can read verdict_votes'
  ) THEN
    CREATE POLICY "anyone can read verdict_votes"
      ON verdict_votes FOR SELECT USING (true);
  END IF;
END $$;

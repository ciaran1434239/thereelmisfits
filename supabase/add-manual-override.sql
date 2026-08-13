-- Adds manual override support to reviews.
-- Run in Supabase SQL editor before deploying the pending reviews admin feature.

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS is_manual_override boolean NOT NULL DEFAULT false;

-- Index so the pending-reviews query is fast
CREATE INDEX IF NOT EXISTS reviews_pending_idx
  ON public.reviews (is_manual_override, recommend)
  WHERE is_manual_override = false AND recommend IS NULL;

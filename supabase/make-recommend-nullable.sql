-- Allow recommend to be NULL = "unscored" (excluded from % calculation)
-- true = thumbs up, false = thumbs down, null = no clear signal found

ALTER TABLE public.reviews ALTER COLUMN recommend DROP NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN recommend DROP DEFAULT;

-- Reset all existing reviews to null so they get re-scored cleanly on next sync/backfill
UPDATE public.reviews SET recommend = NULL;

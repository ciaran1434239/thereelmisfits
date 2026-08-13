-- Run this in Supabase SQL editor if TV shows are not appearing in the reviews filter.
-- Ensures the shows table exists and that reviews.show_id has a declared FK.

CREATE TABLE IF NOT EXISTS public.shows (
  id         bigint PRIMARY KEY,
  title      text NOT NULL,
  slug       text,
  backdrop_path text,
  poster_path   text
);

-- Add show_id column to reviews if missing
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS show_id bigint REFERENCES public.shows(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS season_number int;

-- Supabase needs an explicit FK to support nested selects like shows(reviews(...)).
-- If show_id already exists but has no FK, drop & recreate it:
-- ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_show_id_fkey;
-- ALTER TABLE public.reviews ADD CONSTRAINT reviews_show_id_fkey FOREIGN KEY (show_id) REFERENCES public.shows(id) ON DELETE CASCADE;

-- Quick diagnostic: how many shows and show-reviews exist?
SELECT 'shows' AS tbl, COUNT(*) FROM public.shows
UNION ALL
SELECT 'reviews_with_show_id', COUNT(*) FROM public.reviews WHERE show_id IS NOT NULL;

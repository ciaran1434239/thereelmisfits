-- Adds an optional hand-written consensus summary to movies and shows.
-- Run in Supabase SQL editor.

ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS consensus_summary text;
ALTER TABLE public.shows  ADD COLUMN IF NOT EXISTS consensus_summary text;

-- To set one manually:
-- UPDATE public.movies SET consensus_summary = 'A stunning visual spectacle that divides critics on its emotional depth.' WHERE title = 'Mortal Kombat II';

-- Run this in Supabase SQL editor
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS snippet text;

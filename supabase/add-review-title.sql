-- Add title column to reviews table for storing the YouTube video title
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS title text;

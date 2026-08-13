-- Add snippet column to reviews table for storing the first line of a YouTube video's description
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS snippet text;

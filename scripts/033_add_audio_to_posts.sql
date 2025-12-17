-- Add audio_url column to posts table for soundtracks
ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Add comment to explain the column
COMMENT
ON COLUMN posts.audio_url IS 'URL to audio soundtrack attached to picture posts';

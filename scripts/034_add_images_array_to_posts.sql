-- Add images array field to posts table for multi-image support
ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS images TEXT[];

-- Add comment
COMMENT
ON COLUMN posts.images IS 'Array of image URLs for multi-image posts';

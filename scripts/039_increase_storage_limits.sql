-- Increase storage limits for video uploads
-- Update media bucket to allow up to 500MB files (524288000 bytes)
UPDATE storage.buckets
SET file_size_limit = 524288000
WHERE id = 'media';

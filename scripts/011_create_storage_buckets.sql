-- Create storage buckets for media uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 52428800, ARRAY['image/*', 'video/*', 'audio/*', 'application/pdf']::text[]),
       ('avatars', 'avatars', true, 5242880, ARRAY['image/*']::text[]) ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for media bucket
CREATE
POLICY "Anyone can view media" ON storage.objects
  FOR
SELECT USING (bucket_id = 'media');

CREATE
POLICY "Authenticated users can upload media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media' 
    AND auth.role() = 'authenticated'
  );

CREATE
POLICY "Users can update their own media" ON storage.objects
  FOR
UPDATE USING (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE
POLICY "Users can delete their own media" ON storage.objects
  FOR DELETE
USING (
    bucket_id = 'media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Set up storage policies for avatars bucket
CREATE
POLICY "Anyone can view avatars" ON storage.objects
  FOR
SELECT USING (bucket_id = 'avatars');

CREATE
POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

CREATE
POLICY "Users can update their own avatars" ON storage.objects
  FOR
UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE
POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

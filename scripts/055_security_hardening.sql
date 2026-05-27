-- Migration 055: security hardening
-- Hardens exposed views, storage policies, and trigger-only helper functions.

DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE OR REPLACE VIEW public.artworks_with_stats
WITH (security_invoker = true) AS
SELECT
  a.*,
  count(distinct al.user_id) as like_count,
  count(distinct ac.id) as comment_count
FROM public.artworks a
LEFT JOIN public.artwork_likes al ON a.id = al.artwork_id
LEFT JOIN public.artwork_comments ac ON a.id = ac.artwork_id
GROUP BY a.id;

CREATE OR REPLACE VIEW public.artist_profiles_with_stats
WITH (security_invoker = true) AS
SELECT
  ap.*,
  count(distinct aw.id) as artwork_count,
  count(distinct ac.id) as collection_count,
  sum(aw.view_count) as total_views,
  count(distinct f.follower_id) as follower_count
FROM public.artist_profiles ap
LEFT JOIN public.artworks aw ON ap.user_id = aw.artist_id
LEFT JOIN public.art_collections ac ON ap.user_id = ac.artist_id
LEFT JOIN public.follows f ON ap.user_id = f.following_id
GROUP BY ap.id;

CREATE OR REPLACE VIEW public.promotional_posts_with_artwork
WITH (security_invoker = true) AS
SELECT
  p.*,
  a.title as artwork_title,
  a.description as artwork_description,
  a.media_type as artwork_media_type,
  a.thumbnail_url as artwork_thumbnail,
  a.tags as artwork_tags,
  a.medium as artwork_medium,
  a.content_rating as artwork_content_rating
FROM public.posts p
LEFT JOIN public.artworks a ON p.artwork_id = a.id
WHERE p.is_promotional = true;

CREATE OR REPLACE VIEW public.artists_with_profiles
WITH (security_invoker = true) AS
SELECT
  ap.*,
  p.username,
  p.display_name,
  p.avatar_url,
  p.bio as profile_bio,
  p.created_at as profile_created_at,
  p.artist_since
FROM public.artist_profiles ap
INNER JOIN public.profiles p ON ap.user_id = p.id
WHERE p.is_artist = true;

CREATE OR REPLACE VIEW public.artist_full_engagement_metrics
WITH (security_invoker = true) AS
SELECT
  p.id as artist_id,
  p.username,
  p.display_name,
  p.artist_since,
  COUNT(DISTINCT aw.id) as total_artworks,
  COALESCE(SUM(aw.view_count), 0) as total_artwork_views,
  COUNT(DISTINCT awl.user_id) as total_artwork_likes,
  COUNT(DISTINCT awc.id) as total_artwork_comments,
  COUNT(DISTINCT ac.id) as total_collections,
  COUNT(DISTINCT cr.id) as total_commission_requests,
  COUNT(DISTINCT cr.id) FILTER (WHERE cr.status = 'accepted') as accepted_commissions,
  COUNT(DISTINCT po.id) as total_posts,
  COUNT(DISTINCT po.id) FILTER (WHERE po.is_promotional = true) as promotional_posts,
  COUNT(DISTINCT f.follower_id) as total_followers
FROM public.profiles p
LEFT JOIN public.artworks aw ON p.id = aw.artist_id
LEFT JOIN public.artwork_likes awl ON aw.id = awl.artwork_id
LEFT JOIN public.artwork_comments awc ON aw.id = awc.artwork_id
LEFT JOIN public.art_collections ac ON p.id = ac.artist_id
LEFT JOIN public.commission_requests cr ON p.id = cr.artist_id
LEFT JOIN public.posts po ON p.id = po.author_id
LEFT JOIN public.follows f ON p.id = f.following_id
WHERE p.is_artist = true
GROUP BY p.id, p.username, p.display_name, p.artist_since;

DO $$
DECLARE
  fn_signature TEXT;
BEGIN
  FOREACH fn_signature IN ARRAY ARRAY[
    'public.handle_new_user()',
    'public.check_rate_limit(uuid, inet, text, integer, integer)'
  ]
  LOOP
    IF to_regprocedure(fn_signature) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn_signature);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn_signature);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn_signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn_signature);
  END LOOP;
END $$;

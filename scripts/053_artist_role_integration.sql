-- Migration 053: Artist Role Integration
-- Adds artist role flags to profiles and promotional content support to posts
-- This connects the artist showcase system with the core social platform

-- ============================================================================
-- PROFILES TABLE ENHANCEMENT
-- ============================================================================

-- Add artist role flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_artist boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS artist_since timestamptz;

-- Create index for efficient artist queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_artist
ON public.profiles(is_artist) WHERE is_artist = true;

-- Add comments
COMMENT ON COLUMN public.profiles.is_artist IS
  'Flag indicating if user has created an artist profile and has access to artist features';
COMMENT ON COLUMN public.profiles.artist_since IS
  'Timestamp when user first became an artist (created artist profile)';

-- ============================================================================
-- POSTS TABLE ENHANCEMENT
-- ============================================================================

-- Add promotional content support
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS is_promotional boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS artwork_id uuid REFERENCES public.artworks(id) ON DELETE SET NULL;

-- Create indexes for promotional content queries
CREATE INDEX IF NOT EXISTS idx_posts_artwork_id
ON public.posts(artwork_id) WHERE artwork_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_promotional
ON public.posts(is_promotional) WHERE is_promotional = true;

-- Add comments
COMMENT ON COLUMN public.posts.is_promotional IS
  'Indicates if this post is promotional content (e.g., artist showcasing their work, merchant advertising products)';
COMMENT ON COLUMN public.posts.artwork_id IS
  'Optional link to an artwork in the artist showcase. Used when artists share their portfolio pieces in the social feed.';

-- ============================================================================
-- DATA MIGRATION
-- ============================================================================

-- Set is_artist flag for users who already have artist profiles
UPDATE public.profiles
SET is_artist = true,
    artist_since = artist_profiles.created_at
FROM public.artist_profiles
WHERE profiles.id = artist_profiles.user_id
  AND profiles.is_artist = false; -- Only update if not already set

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to automatically set artist flag when artist profile is created
CREATE OR REPLACE FUNCTION set_artist_flag_on_profile_creation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET is_artist = true,
        artist_since = COALESCE(artist_since, NEW.created_at)
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on artist profile creation
DROP TRIGGER IF EXISTS on_artist_profile_created ON public.artist_profiles;
CREATE TRIGGER on_artist_profile_created
    AFTER INSERT ON public.artist_profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_artist_flag_on_profile_creation();

-- Function to handle artist profile deletion (optional: keep flag or remove it)
-- For now, we keep the flag to maintain historical record
CREATE OR REPLACE FUNCTION handle_artist_profile_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Keep is_artist flag but could add a deleted_at column to artist_profiles instead
    -- This preserves that they were once an artist
    -- If you want to remove the flag, uncomment below:
    -- UPDATE public.profiles
    -- SET is_artist = false
    -- WHERE id = OLD.user_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_artist_profile_deleted ON public.artist_profiles;
CREATE TRIGGER on_artist_profile_deleted
    AFTER DELETE ON public.artist_profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_artist_profile_deletion();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a user is an artist
CREATE OR REPLACE FUNCTION is_user_artist(user_id uuid)
RETURNS boolean AS $$
    SELECT is_artist
    FROM public.profiles
    WHERE id = user_id;
$$ LANGUAGE sql STABLE;

-- Function to get artist profile for a user
CREATE OR REPLACE FUNCTION get_user_artist_profile(user_id uuid)
RETURNS SETOF public.artist_profiles AS $$
    SELECT *
    FROM public.artist_profiles
    WHERE user_id = user_id;
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for posts with linked artwork details
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

-- View for artist profiles with full user details
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

-- Grant select permissions on views
GRANT SELECT ON public.promotional_posts_with_artwork TO authenticated;
GRANT SELECT ON public.artists_with_profiles TO authenticated;

-- ============================================================================
-- RLS POLICY UPDATES
-- ============================================================================

-- Update posts RLS to handle promotional content
-- (Existing policies should already cover this, but we can add specific ones)

-- Allow viewing promotional posts (same as regular posts)
CREATE POLICY IF NOT EXISTS "Promotional posts follow same visibility rules as regular posts"
    ON public.posts FOR SELECT
    USING (
        -- Public or visible based on existing post visibility logic
        visibility = 'public' OR
        author_id = auth.uid() OR
        (visibility = 'friends' AND EXISTS (
            SELECT 1 FROM public.friendships
            WHERE (user_id = author_id AND friend_id = auth.uid() AND status = 'accepted')
               OR (user_id = auth.uid() AND friend_id = author_id AND status = 'accepted')
        )) OR
        (visibility = 'followers' AND EXISTS (
            SELECT 1 FROM public.follows
            WHERE following_id = author_id AND follower_id = auth.uid()
        ))
    );

-- ============================================================================
-- ANALYTICS
-- ============================================================================

-- View for artist engagement metrics including both social and showcase content
CREATE OR REPLACE VIEW public.artist_full_engagement_metrics
WITH (security_invoker = true) AS
SELECT
    p.id as artist_id,
    p.username,
    p.display_name,
    p.artist_since,
    -- Showcase metrics
    COUNT(DISTINCT aw.id) as total_artworks,
    COALESCE(SUM(aw.view_count), 0) as total_artwork_views,
    COUNT(DISTINCT awl.user_id) as total_artwork_likes,
    COUNT(DISTINCT awc.id) as total_artwork_comments,
    COUNT(DISTINCT ac.id) as total_collections,
    COUNT(DISTINCT cr.id) as total_commission_requests,
    COUNT(DISTINCT cr.id) FILTER (WHERE cr.status = 'accepted') as accepted_commissions,
    -- Social metrics
    COUNT(DISTINCT po.id) as total_posts,
    COUNT(DISTINCT po.id) FILTER (WHERE po.is_promotional = true) as promotional_posts,
    -- Following metrics
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

GRANT SELECT ON public.artist_full_engagement_metrics TO authenticated;

-- ============================================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite index for finding promotional posts by artist
CREATE INDEX IF NOT EXISTS idx_posts_author_promotional
ON public.posts(author_id, is_promotional)
WHERE is_promotional = true;

-- Index for finding posts linked to specific artworks
CREATE INDEX IF NOT EXISTS idx_posts_artwork_lookup
ON public.posts(artwork_id, created_at DESC)
WHERE artwork_id IS NOT NULL;

-- ============================================================================
-- VALIDATION
-- ============================================================================

-- Function to validate that artwork exists before linking to post
CREATE OR REPLACE FUNCTION validate_artwork_link()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.artwork_id IS NOT NULL THEN
        -- Check that artwork exists
        IF NOT EXISTS (SELECT 1 FROM public.artworks WHERE id = NEW.artwork_id) THEN
            RAISE EXCEPTION 'Artwork with id % does not exist', NEW.artwork_id;
        END IF;

        -- Check that post author is the artwork artist
        IF NOT EXISTS (
            SELECT 1 FROM public.artworks
            WHERE id = NEW.artwork_id AND artist_id = NEW.author_id
        ) THEN
            RAISE EXCEPTION 'Post author must be the artwork artist';
        END IF;

        -- Automatically mark as promotional if artwork_id is set
        NEW.is_promotional := true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_artwork_link_trigger ON public.posts;
CREATE TRIGGER validate_artwork_link_trigger
    BEFORE INSERT OR UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION validate_artwork_link();

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON VIEW public.promotional_posts_with_artwork IS
  'Posts that are marked as promotional with their linked artwork details';

COMMENT ON VIEW public.artists_with_profiles IS
  'Artist profiles joined with their full user profile information';

COMMENT ON VIEW public.artist_full_engagement_metrics IS
  'Comprehensive engagement metrics for artists including both showcase and social activity';

COMMENT ON FUNCTION is_user_artist(uuid) IS
  'Checks if a user has artist capabilities (has created an artist profile)';

COMMENT ON FUNCTION get_user_artist_profile(uuid) IS
  'Returns the artist profile for a given user if they are an artist';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Record migration
INSERT INTO public.migrations (name, executed_at)
VALUES ('053_artist_role_integration', now())
ON CONFLICT (name) DO NOTHING;

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 053 completed successfully!';
    RAISE NOTICE '- Added is_artist flag to profiles table';
    RAISE NOTICE '- Added is_promotional and artwork_id to posts table';
    RAISE NOTICE '- Created triggers for automatic artist flag management';
    RAISE NOTICE '- Created helper functions and views';
    RAISE NOTICE '- Updated existing artist profiles with is_artist flag';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update TypeScript types to include new fields';
    RAISE NOTICE '2. Create role checking utilities (lib/roles.ts)';
    RAISE NOTICE '3. Build artist onboarding flow';
    RAISE NOTICE '4. Add promotional post UI components';
END $$;

-- Feature flags table
CREATE TABLE IF NOT EXISTS public.feature_flags
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    uuid_generate_v4
(
),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ DEFAULT NOW
(
)
    );

-- Add is_admin to profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Enable RLS for feature_flags
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can view feature flags
CREATE
POLICY "Public can view enabled feature flags"
    ON public.feature_flags
    FOR
SELECT
    USING (true);

-- Only admins can manage feature flags
CREATE
POLICY "Admins can manage feature flags"
    ON public.feature_flags
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Seed initial feature flags
INSERT INTO public.feature_flags (name, description, is_enabled)
VALUES
    -- Core platform flags
    ('premium_tts', 'Enable high-quality AI Text-to-Speech for premium users', true),
    ('advanced_analytics', 'Show detailed post and profile analytics', false),
    ('beta_chat_rooms', 'Access to experimental video chat rooms', true),
    ('marketplace_video', 'Support for video previews in marketplace listings', true),
    ('ai_recommendations', 'Enable AI-powered content recommendations in Discovery', true),
    ('toy_viewer_3d', 'Enable 3D interactive toy viewer in reviews', true),
    ('localized_discovery', 'Enable location-based filtering in Discovery Hub', true),

    -- AI feature flags
    ('ai_content_moderation', 'AI-powered content moderation for posts, messages, and comments', false),
    ('ai_translation_assist', 'AI-assisted EN↔FR translation for posts and messages', false),
    ('ai_post_composer', 'AI writing assistant for creating post content', false),
    ('ai_tag_suggestions', 'AI auto-suggest tags from post content', false),
    ('ai_content_recommendations', 'AI-powered personalized feed and content recommendations', false),
    ('ai_people_discovery', 'AI-powered social graph "People You May Know" recommendations', false),
    ('ai_media_caption', 'AI-generated captions for uploaded images and videos', false),
    ('ai_chat_assistant', 'AI social coaching and conversation suggestions', false),
    ('ai_onboarding_assistant', 'AI-guided new user onboarding and profile setup', false),
    ('ai_group_activity', 'AI activity and event suggestion generator for groups', false),

    -- Neo4j feature flags (optional, requires Neo4j AuraDB)
    ('neo4j_graph_queries', 'Neo4j-backed social graph queries for galaxy visualization and recommendations', false),
    ('neo4j_community_detection', 'Neo4j community detection algorithms for discovery', false),
    ('neo4j_recommendations', 'Neo4j-powered friend and content recommendations', false)
ON CONFLICT (name) DO NOTHING;

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

-- Seed some initial flags
INSERT INTO public.feature_flags (name, description, is_enabled)
VALUES ('premium_tts', 'Enable high-quality AI Text-to-Speech for premium users', true),
       ('advanced_analytics', 'Show detailed post and profile analytics', false),
       ('beta_chat_rooms', 'Access to experimental video chat rooms', true),
       ('marketplace_video', 'Support for video previews in marketplace listings', true) ON CONFLICT (name) DO NOTHING;

-- Add is_admin column to profiles table if it doesn't exist
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now
(
) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now
(
) NOT NULL
    );

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON public.feature_flags(name);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Everyone can read feature flags
CREATE
POLICY "Anyone can read feature flags"
    ON public.feature_flags
    FOR
SELECT
    USING (true);

-- Only admins can insert/update/delete feature flags
CREATE
POLICY "Only admins can insert feature flags"
    ON public.feature_flags
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE
POLICY "Only admins can update feature flags"
    ON public.feature_flags
    FOR
UPDATE
    USING (
    EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
    )
    );

CREATE
POLICY "Only admins can delete feature flags"
    ON public.feature_flags
    FOR DELETE
USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Create updated_at trigger
CREATE
OR REPLACE FUNCTION public.update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at
= now();
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE
    ON public.feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION public.update_feature_flags_updated_at();

-- Insert initial feature flags
INSERT INTO public.feature_flags (name, description, is_enabled)
VALUES ('marketplace_video', 'Enable video uploads in marketplace listings', true),
       ('premium_features', 'Enable premium subscription features', true),
       ('chat_rooms', 'Enable chat rooms feature', true),
       ('events', 'Enable events feature', true),
       ('groups', 'Enable groups feature', true),
       ('network_map', 'Enable network visualization map', true),
       ('discovery', 'Enable discovery/matching feature', true),
       ('polls', 'Enable poll creation in posts', true),
       ('audio_posts', 'Enable audio posts', true),
       ('anonymous_questions', 'Enable anonymous Q&A feature', true) ON CONFLICT (name) DO NOTHING;

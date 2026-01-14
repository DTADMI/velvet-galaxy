-- Create external_profiles table for people not on the network
CREATE TABLE IF NOT EXISTS public.external_profiles
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    user_id UUID NOT NULL REFERENCES public.profiles
(
    id
) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    relationship_type TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now
(
) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now
(
) NOT NULL,
    is_visible_on_map BOOLEAN DEFAULT false,
    CONSTRAINT valid_relationship_type CHECK
(
    relationship_type
    IN
(
    'friend',
    'partner',
    'family',
    'colleague',
    'acquaintance',
    'other'
)
    )
    );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_external_profiles_user_id ON public.external_profiles(user_id);

-- Enable RLS
ALTER TABLE public.external_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE
POLICY "Users can view their own external profiles"
    ON public.external_profiles
    FOR
SELECT
    USING (auth.uid() = user_id);

CREATE
POLICY "Users can insert their own external profiles"
    ON public.external_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE
POLICY "Users can update their own external profiles"
    ON public.external_profiles
    FOR
UPDATE
    USING (auth.uid() = user_id);

CREATE
POLICY "Users can delete their own external profiles"
    ON public.external_profiles
    FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE
OR REPLACE FUNCTION public.update_external_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at
= now();
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER update_external_profiles_updated_at
    BEFORE UPDATE
    ON public.external_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_external_profiles_updated_at();

COMMENT
ON TABLE public.external_profiles IS 'Profiles for relationships with people not on the network';
COMMENT
ON COLUMN public.external_profiles.is_visible_on_map IS 'Whether this external profile appears on the 3D network map';

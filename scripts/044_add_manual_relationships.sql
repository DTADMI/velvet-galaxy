-- Add support for manual (view-only) relationships on the 3D map
-- These are relationships created directly on the map for visualization purposes only

-- Add is_manual flag to external_relationships to distinguish manual vs auto
ALTER TABLE public.external_relationships
    ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false;

-- Add comment to clarify the purpose
COMMENT
ON COLUMN public.external_relationships.is_manual IS 'True if relationship was manually created on the map for visualization only';

-- Create table for manual relationships between two external profiles
CREATE TABLE IF NOT EXISTS public.manual_relationships
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
    from_profile_id UUID NOT NULL REFERENCES public.external_profiles
(
    id
)
  ON DELETE CASCADE,
    to_profile_id UUID NOT NULL REFERENCES public.external_profiles
(
    id
)
  ON DELETE CASCADE,
    relationship_type_id UUID REFERENCES public.custom_relationship_types
(
    id
)
  ON DELETE SET NULL,
    default_type VARCHAR
(
    50
),
    label TEXT,
    notes TEXT,
    is_visible_on_map BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ DEFAULT NOW
(
),
    CONSTRAINT manual_relationships_type_check CHECK
(
(
    relationship_type_id
    IS
    NOT
    NULL
    AND
    default_type
    IS
    NULL
) OR
(
    relationship_type_id
    IS
    NULL
    AND
    default_type
    IS
    NOT
    NULL
)
    ),
    CONSTRAINT manual_relationships_different_profiles CHECK
(
    from_profile_id
    !=
    to_profile_id
)
    );

-- Enable RLS
ALTER TABLE public.manual_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manual_relationships
DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'manual_relationships'
        AND policyname = 'Users can view their own manual relationships'
    ) THEN
        CREATE
POLICY "Users can view their own manual relationships"
            ON public.manual_relationships
            FOR
SELECT
    USING (auth.uid() = user_id);
END IF;
END $$;

DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'manual_relationships'
        AND policyname = 'Users can create their own manual relationships'
    ) THEN
        CREATE
POLICY "Users can create their own manual relationships"
            ON public.manual_relationships
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
END IF;
END $$;

DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'manual_relationships'
        AND policyname = 'Users can update their own manual relationships'
    ) THEN
        CREATE
POLICY "Users can update their own manual relationships"
            ON public.manual_relationships
            FOR
UPDATE
    USING (auth.uid() = user_id);
END IF;
END $$;

DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'manual_relationships'
        AND policyname = 'Users can delete their own manual relationships'
    ) THEN
        CREATE
POLICY "Users can delete their own manual relationships"
            ON public.manual_relationships
            FOR DELETE
USING (auth.uid() = user_id);
END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_manual_relationships_user_id ON public.manual_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_relationships_from_profile ON public.manual_relationships(from_profile_id);
CREATE INDEX IF NOT EXISTS idx_manual_relationships_to_profile ON public.manual_relationships(to_profile_id);
CREATE INDEX IF NOT EXISTS idx_external_relationships_manual ON public.external_relationships(user_id, is_manual);

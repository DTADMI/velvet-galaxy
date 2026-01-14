-- Add line style support to custom_relationship_types
-- This allows users to customize how relationship edges appear on the 3D map

-- Add line_style column to custom_relationship_types
ALTER TABLE public.custom_relationship_types
    ADD COLUMN IF NOT EXISTS line_style VARCHAR (20) DEFAULT 'solid' CHECK (line_style IN ('solid', 'dashed', 'dotted', 'double', 'wavy'));

-- Add order/priority for displaying multiple edges
ALTER TABLE public.custom_relationship_types
    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add visibility toggle
ALTER TABLE public.custom_relationship_types
    ADD COLUMN IF NOT EXISTS is_visible_on_map BOOLEAN DEFAULT true;

-- Update existing records to have default line style
UPDATE public.custom_relationship_types
SET line_style = 'solid'
WHERE line_style IS NULL;

-- Create table for external profiles (people not in the network)
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
    display_name VARCHAR
(
    255
) NOT NULL,
    notes TEXT,
    is_visible_on_map BOOLEAN DEFAULT true,
    node_color VARCHAR
(
    7
) DEFAULT '#6b7280', -- Default gray color
    created_at TIMESTAMPTZ DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ DEFAULT NOW
(
)
    );

-- Create table for relationships with external profiles
CREATE TABLE IF NOT EXISTS public.external_relationships
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
    external_profile_id UUID NOT NULL REFERENCES public.external_profiles
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
), -- Used when relationship_type_id is NULL
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ DEFAULT NOW
(
),
    CONSTRAINT external_relationships_type_check CHECK
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
    )
    );

-- Enable RLS
ALTER TABLE public.external_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for external_profiles
DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'external_profiles'
        AND policyname = 'Users can view their own external profiles'
    ) THEN
        CREATE
POLICY "Users can view their own external profiles"
            ON public.external_profiles
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
        WHERE tablename = 'external_profiles'
        AND policyname = 'Users can create their own external profiles'
    ) THEN
        CREATE
POLICY "Users can create their own external profiles"
            ON public.external_profiles
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
        WHERE tablename = 'external_profiles'
        AND policyname = 'Users can update their own external profiles'
    ) THEN
        CREATE
POLICY "Users can update their own external profiles"
            ON public.external_profiles
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
        WHERE tablename = 'external_profiles'
        AND policyname = 'Users can delete their own external profiles'
    ) THEN
        CREATE
POLICY "Users can delete their own external profiles"
            ON public.external_profiles
            FOR DELETE
USING (auth.uid() = user_id);
END IF;
END $$;

-- RLS Policies for external_relationships
DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'external_relationships'
        AND policyname = 'Users can view their own external relationships'
    ) THEN
        CREATE
POLICY "Users can view their own external relationships"
            ON public.external_relationships
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
        WHERE tablename = 'external_relationships'
        AND policyname = 'Users can create their own external relationships'
    ) THEN
        CREATE
POLICY "Users can create their own external relationships"
            ON public.external_relationships
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
        WHERE tablename = 'external_relationships'
        AND policyname = 'Users can update their own external relationships'
    ) THEN
        CREATE
POLICY "Users can update their own external relationships"
            ON public.external_relationships
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
        WHERE tablename = 'external_relationships'
        AND policyname = 'Users can delete their own external relationships'
    ) THEN
        CREATE
POLICY "Users can delete their own external relationships"
            ON public.external_relationships
            FOR DELETE
USING (auth.uid() = user_id);
END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_profiles_user_id ON public.external_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_external_relationships_user_id ON public.external_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_external_relationships_external_profile_id ON public.external_relationships(external_profile_id);
CREATE INDEX IF NOT EXISTS idx_custom_relationship_types_display_order ON public.custom_relationship_types(user_id, display_order);

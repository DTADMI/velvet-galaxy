-- Rename manual terminology to custom terminology
-- This better reflects that these are custom user-created relationships

-- Rename the table
ALTER TABLE IF EXISTS public.manual_relationships RENAME TO custom_relationships;

-- Rename the column in external_relationships
DO
$$
BEGIN
    IF
EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'external_relationships'
        AND column_name = 'is_manual'
    ) THEN
ALTER TABLE public.external_relationships RENAME COLUMN is_manual TO is_custom;
COMMENT
ON COLUMN public.external_relationships.is_custom IS 'True if relationship was custom created by the user';
END IF;
END $$;

-- Update RLS policy names
DO
$$
BEGIN
    -- Drop old policies if they exist
    DROP
POLICY IF EXISTS "Users can view their own manual relationships" ON public.custom_relationships;
    DROP
POLICY IF EXISTS "Users can create their own manual relationships" ON public.custom_relationships;
    DROP
POLICY IF EXISTS "Users can update their own manual relationships" ON public.custom_relationships;
    DROP
POLICY IF EXISTS "Users can delete their own manual relationships" ON public.custom_relationships;

    -- Create new policies with updated names
    IF
NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'custom_relationships'
        AND policyname = 'Users can view their own custom relationships'
    ) THEN
        CREATE
POLICY "Users can view their own custom relationships"
            ON public.custom_relationships
            FOR
SELECT
    USING (auth.uid() = user_id);
END IF;

    IF
NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'custom_relationships'
        AND policyname = 'Users can create their own custom relationships'
    ) THEN
        CREATE
POLICY "Users can create their own custom relationships"
            ON public.custom_relationships
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
END IF;

    IF
NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'custom_relationships'
        AND policyname = 'Users can update their own custom relationships'
    ) THEN
        CREATE
POLICY "Users can update their own custom relationships"
            ON public.custom_relationships
            FOR
UPDATE
    USING (auth.uid() = user_id);
END IF;

    IF
NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'custom_relationships'
        AND policyname = 'Users can delete their own custom relationships'
    ) THEN
        CREATE
POLICY "Users can delete their own custom relationships"
            ON public.custom_relationships
            FOR DELETE
USING (auth.uid() = user_id);
END IF;
END $$;

-- Rename indexes
ALTER
INDEX IF EXISTS idx_manual_relationships_user_id RENAME TO idx_custom_relationships_user_id;
ALTER
INDEX IF EXISTS idx_manual_relationships_from_profile RENAME TO idx_custom_relationships_from_profile;
ALTER
INDEX IF EXISTS idx_manual_relationships_to_profile RENAME TO idx_custom_relationships_to_profile;
ALTER
INDEX IF EXISTS idx_external_relationships_manual RENAME TO idx_external_relationships_custom;

-- Rename constraint
ALTER TABLE IF EXISTS public.custom_relationships RENAME CONSTRAINT manual_relationships_type_check TO custom_relationships_type_check;
ALTER TABLE IF EXISTS public.custom_relationships RENAME CONSTRAINT manual_relationships_different_profiles TO custom_relationships_different_profiles;

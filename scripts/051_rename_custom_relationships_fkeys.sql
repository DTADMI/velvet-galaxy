-- Rename foreign key constraints from manual_relationships to custom_relationships
-- This ensures PostgREST can find the relationships correctly

-- Rename from_profile_id foreign key
ALTER TABLE IF EXISTS public.custom_relationships
    RENAME CONSTRAINT manual_relationships_from_profile_id_fkey
    TO custom_relationships_from_profile_id_fkey;

-- Rename to_profile_id foreign key
ALTER TABLE IF EXISTS public.custom_relationships
    RENAME CONSTRAINT manual_relationships_to_profile_id_fkey
    TO custom_relationships_to_profile_id_fkey;

-- Rename user_id foreign key (if exists)
DO
$$
BEGIN
    IF
EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'manual_relationships_user_id_fkey'
        AND table_name = 'custom_relationships'
    ) THEN
ALTER TABLE public.custom_relationships
    RENAME CONSTRAINT manual_relationships_user_id_fkey
    TO custom_relationships_user_id_fkey;
END IF;
END $$;

-- Rename relationship_type_id foreign key (if exists)
DO
$$
BEGIN
    IF
EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'manual_relationships_relationship_type_id_fkey'
        AND table_name = 'custom_relationships'
    ) THEN
ALTER TABLE public.custom_relationships
    RENAME CONSTRAINT manual_relationships_relationship_type_id_fkey
    TO custom_relationships_relationship_type_id_fkey;
END IF;
END $$;

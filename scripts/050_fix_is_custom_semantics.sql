-- Fix is_custom semantics to reflect custom type usage, not persistence
-- is_custom should be true when relationship_type_id is set (custom type)
-- is_custom should be false when default_type is set (standard type)

-- Update external_relationships to set is_custom based on relationship_type_id
UPDATE public.external_relationships
SET is_custom = (relationship_type_id IS NOT NULL);

-- Add comment to clarify the semantics
COMMENT
ON COLUMN public.external_relationships.is_custom IS 'True if relationship uses a custom type (relationship_type_id), false if using standard type (default_type)';

-- Note: All relationships in external_relationships and custom_relationships are persisted
-- Temporary/view-only relationships will not be stored in the database at all

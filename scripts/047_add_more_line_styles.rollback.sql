-- Rollback: Revert line style options to original set
-- Description: Restore line_style constraint to original 5 options

ALTER TABLE public.custom_relationship_types
    DROP CONSTRAINT IF EXISTS custom_relationship_types_line_style_check;

ALTER TABLE public.custom_relationship_types
    ADD CONSTRAINT custom_relationship_types_line_style_check
        CHECK (line_style IN ('solid', 'dashed', 'dotted', 'double', 'wavy'));

ALTER TABLE public.relationship_type_requests
    DROP CONSTRAINT IF EXISTS relationship_type_requests_suggested_line_style_check;

ALTER TABLE public.relationship_type_requests
    ADD CONSTRAINT relationship_type_requests_suggested_line_style_check
        CHECK (suggested_line_style IN ('solid', 'dashed', 'dotted', 'double', 'wavy'));

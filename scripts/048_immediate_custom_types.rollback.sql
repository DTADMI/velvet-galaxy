-- Rollback: Revert immediate custom type creation changes
-- Description: Remove pending_global_approval, request_id columns and restore original trigger

DROP POLICY IF EXISTS "Users can view global and their own types" ON public.custom_relationship_types;

CREATE POLICY "Users can view global types"
    ON public.custom_relationship_types
    FOR SELECT
    USING (is_global = true OR user_id = auth.uid());

ALTER TABLE public.custom_relationship_types
    DROP COLUMN IF EXISTS pending_global_approval,
    DROP COLUMN IF EXISTS request_id;

DROP INDEX IF EXISTS idx_custom_relationship_types_pending;
DROP INDEX IF EXISTS idx_custom_relationship_types_request_id;

CREATE OR REPLACE FUNCTION public.handle_approved_relationship_type_request()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        INSERT INTO public.custom_relationship_types (
            user_id, label, node_color, edge_color, line_style,
            is_global, approved_by, approved_at
        ) VALUES (
            NEW.user_id,
            NEW.requested_label,
            COALESCE(NEW.suggested_node_color, '#8b5cf6'),
            COALESCE(NEW.suggested_edge_color, '#a855f7'),
            COALESCE(NEW.suggested_line_style, 'solid'),
            true,
            NEW.reviewed_by,
            NEW.reviewed_at
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

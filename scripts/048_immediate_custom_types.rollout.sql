-- Rollout: Immediate custom type creation with optional public request
-- Description: Allow users to create custom types immediately, with optional admin approval for making them global

ALTER TABLE public.custom_relationship_types
    ADD COLUMN IF NOT EXISTS pending_global_approval BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES public.relationship_type_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_custom_relationship_types_pending ON public.custom_relationship_types(pending_global_approval) WHERE pending_global_approval = true;
CREATE INDEX IF NOT EXISTS idx_custom_relationship_types_request_id ON public.custom_relationship_types(request_id);

CREATE OR REPLACE FUNCTION public.handle_approved_relationship_type_request()
RETURNS TRIGGER AS $$
DECLARE
    existing_type_id UUID;
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        SELECT id INTO existing_type_id
        FROM public.custom_relationship_types
        WHERE request_id = NEW.id;

        IF existing_type_id IS NOT NULL THEN
            UPDATE public.custom_relationship_types
            SET is_global               = true,
                approved_by             = NEW.reviewed_by,
                approved_at             = NEW.reviewed_at,
                pending_global_approval = false,
                label                   = NEW.requested_label,
                node_color              = COALESCE(NEW.suggested_node_color, node_color),
                edge_color              = COALESCE(NEW.suggested_edge_color, edge_color),
                line_style              = COALESCE(NEW.suggested_line_style, line_style)
            WHERE id = existing_type_id;
        ELSE
            INSERT INTO public.custom_relationship_types (
                user_id, label, node_color, edge_color, line_style,
                is_global, approved_by, approved_at, request_id
            ) VALUES (
                NEW.reviewed_by,
                NEW.requested_label,
                COALESCE(NEW.suggested_node_color, '#8b5cf6'),
                COALESCE(NEW.suggested_edge_color, '#a855f7'),
                COALESCE(NEW.suggested_line_style, 'solid'),
                true,
                NEW.reviewed_by,
                NEW.reviewed_at,
                NEW.id
            );
        END IF;

        INSERT INTO public.admin_actions (admin_id, action_type, target_type, target_id, description, metadata)
        VALUES (NEW.reviewed_by, 'approve_relationship_type', 'relationship_type_request', NEW.id,
                'Approved custom relationship type request: ' || NEW.requested_label,
                jsonb_build_object('label', NEW.requested_label, 'requester_id', NEW.user_id, 'existing_type_id', existing_type_id));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Users can view global types" ON public.custom_relationship_types;
DROP POLICY IF EXISTS "Users can view global and their own types" ON public.custom_relationship_types;

CREATE POLICY "Users can view global and their own types"
    ON public.custom_relationship_types
    FOR SELECT
    USING (is_global = true OR pending_global_approval = true OR user_id = auth.uid());

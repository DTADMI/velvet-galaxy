-- Migration: Admin System and Custom Relationship Type Requests
-- Description: Add admin role management and system for users to request new custom relationship types

-- Add admin role to profiles table
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create table for custom relationship type requests
CREATE TABLE IF NOT EXISTS public.relationship_type_requests
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
    requested_label TEXT NOT NULL,
    description TEXT,
    suggested_node_color VARCHAR
(
    7
),
    suggested_edge_color VARCHAR
(
    7
),
    suggested_line_style VARCHAR
(
    20
) CHECK
(
    suggested_line_style
    IN
(
    'solid',
    'dashed',
    'dotted'
)),
    status VARCHAR
(
    20
) DEFAULT 'pending' CHECK
(
    status
    IN
(
    'pending',
    'approved',
    'rejected'
)),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles
(
    id
)
  ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ DEFAULT NOW
(
)
    );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_relationship_type_requests_user_id ON public.relationship_type_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_relationship_type_requests_status ON public.relationship_type_requests(status);
CREATE INDEX IF NOT EXISTS idx_relationship_type_requests_reviewed_by ON public.relationship_type_requests(reviewed_by);

-- Update custom_relationship_types to track approval status
ALTER TABLE public.custom_relationship_types
    ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON
DELETE
SET NULL,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Create index for global types (for autocomplete)
CREATE INDEX IF NOT EXISTS idx_custom_relationship_types_global ON public.custom_relationship_types(is_global) WHERE is_global = true;

-- RLS Policies for relationship_type_requests

DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'relationship_type_requests'
        AND policyname = 'Users can view their own requests'
    ) THEN
        CREATE
POLICY "Users can view their own requests"
            ON public.relationship_type_requests
            FOR
SELECT
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));
END IF;
END $$;

DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'relationship_type_requests'
        AND policyname = 'Users can create their own requests'
    ) THEN
        CREATE
POLICY "Users can create their own requests"
            ON public.relationship_type_requests
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
        WHERE tablename = 'relationship_type_requests'
        AND policyname = 'Users can update their own pending requests'
    ) THEN
        CREATE
POLICY "Users can update their own pending requests"
            ON public.relationship_type_requests
            FOR
UPDATE
    USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');
END IF;
END $$;

DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'relationship_type_requests'
        AND policyname = 'Admins can update all requests'
    ) THEN
        CREATE
POLICY "Admins can update all requests"
            ON public.relationship_type_requests
            FOR
UPDATE
    USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));
END IF;
END $$;

DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'relationship_type_requests'
        AND policyname = 'Users can delete their own pending requests'
    ) THEN
        CREATE
POLICY "Users can delete their own pending requests"
            ON public.relationship_type_requests
            FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');
END IF;
END $$;

-- Enable RLS
ALTER TABLE public.relationship_type_requests ENABLE ROW LEVEL SECURITY;

-- Update RLS for custom_relationship_types to allow viewing global types

DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'custom_relationship_types'
        AND policyname = 'Users can view global types'
    ) THEN
        CREATE
POLICY "Users can view global types"
            ON public.custom_relationship_types
            FOR
SELECT
    USING (is_global = true OR user_id = auth.uid());
END IF;
END $$;

-- Create table for admin actions log
CREATE TABLE IF NOT EXISTS public.admin_actions
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    admin_id UUID NOT NULL REFERENCES public.profiles
(
    id
) ON DELETE CASCADE,
    action_type VARCHAR
(
    50
) NOT NULL,
    target_type VARCHAR
(
    50
),
    target_id UUID,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW
(
)
    );

-- Create index for admin actions
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);

-- RLS for admin_actions

DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'admin_actions'
        AND policyname = 'Only admins can view admin actions'
    ) THEN
        CREATE
POLICY "Only admins can view admin actions"
            ON public.admin_actions
            FOR
SELECT
    USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));
END IF;
END $$;

DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'admin_actions'
        AND policyname = 'Only admins can insert admin actions'
    ) THEN
        CREATE
POLICY "Only admins can insert admin actions"
            ON public.admin_actions
            FOR INSERT
            WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true) AND auth.uid() = admin_id);
END IF;
END $$;

-- Enable RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Function to automatically convert approved request to global custom type
CREATE
OR REPLACE FUNCTION public.handle_approved_relationship_type_request()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changed to approved, create a global custom relationship type
    IF
NEW.status = 'approved' AND OLD.status = 'pending' THEN
        INSERT INTO public.custom_relationship_types (
            user_id,
            label,
            node_color,
            edge_color,
            line_style,
            is_global,
            approved_by,
            approved_at
        ) VALUES (
            NEW.reviewed_by,  -- Admin becomes the owner
            NEW.requested_label,
            COALESCE(NEW.suggested_node_color, '#8b5cf6'),
            COALESCE(NEW.suggested_edge_color, '#a855f7'),
            COALESCE(NEW.suggested_line_style, 'solid'),
            true,
            NEW.reviewed_by,
            NEW.reviewed_at
        );

        -- Log admin action
INSERT INTO public.admin_actions (admin_id,
                                  action_type,
                                  target_type,
                                  target_id,
                                  description,
                                  metadata)
VALUES (NEW.reviewed_by,
        'approve_relationship_type',
        'relationship_type_request',
        NEW.id,
        'Approved custom relationship type request: ' || NEW.requested_label,
        jsonb_build_object(
                'label', NEW.requested_label,
                'requester_id', NEW.user_id
        ));
END IF;

RETURN NEW;
END;
$$
LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for approved requests
DROP TRIGGER IF EXISTS on_relationship_type_request_approved ON public.relationship_type_requests;
CREATE TRIGGER on_relationship_type_request_approved
    AFTER UPDATE
    ON public.relationship_type_requests
    FOR EACH ROW
    WHEN (NEW.status = 'approved' AND OLD.status = 'pending')
    EXECUTE FUNCTION public.handle_approved_relationship_type_request();

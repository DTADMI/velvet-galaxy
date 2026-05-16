-- Migration: Create audit log table for tracking sensitive operations
-- May 2026

CREATE TABLE IF NOT EXISTS public.audit_log
(
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID REFERENCES auth.users (id) ON DELETE SET NULL,
    action     TEXT        NOT NULL,
    target_type TEXT,
    target_id  UUID,
    metadata   JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying by user and action
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log (created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
    ON public.audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Server-side only writes (via SECURITY DEFINER functions)
CREATE POLICY "Server can insert audit logs"
    ON public.audit_log
    FOR INSERT
    WITH CHECK (true);

-- Audit logging function for use in triggers and server actions
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_user_id UUID,
    p_action TEXT,
    p_target_type TEXT DEFAULT NULL,
    p_target_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = 'public'
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.audit_log (user_id, action, target_type, target_id, metadata, ip_address, user_agent)
    VALUES (p_user_id, p_action, p_target_type, p_target_id, p_metadata, p_ip_address, p_user_agent)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated;

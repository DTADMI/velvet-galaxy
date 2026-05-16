-- Rollback: Remove audit log table
DROP POLICY IF EXISTS "Server can insert audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_log;
DROP FUNCTION IF EXISTS public.log_audit_event;
DROP TABLE IF EXISTS public.audit_log;

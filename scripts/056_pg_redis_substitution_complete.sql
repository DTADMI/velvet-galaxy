-- Migration 056: Complete PostgreSQL Redis Substitution (Velvet Galaxy)
-- Brings VG to the same PG-backed state as AL/SF. VG already had an older
-- rate_limits schema (user_id/ip_address/action/count) + a legacy
-- check_rate_limit(uuid,inet,text,int,int). The current code path
-- (lib/rate-limit.ts -> lib/security/pg-rate-limit.ts) expects:
--     check_rate_limit(p_identifier TEXT, p_route TEXT, p_max_requests INT, p_window_seconds INT)
-- This migration adds the missing pieces idempotently and adds the new
-- function overload matching the code.

-- 1. Extend the existing rate_limits table with the code-expected columns.
ALTER TABLE IF EXISTS rate_limits
  ADD COLUMN IF NOT EXISTS identifier TEXT,
  ADD COLUMN IF NOT EXISTS route TEXT;
-- The legacy `action` column is NOT NULL; the new identifier/route pattern does
-- not populate it. Make it nullable so both the old and new check_rate_limit
-- overloads can write to the same table.
ALTER TABLE IF EXISTS rate_limits ALTER COLUMN action DROP NOT NULL;
-- Legacy check constraint required user_id OR ip_address; the new pattern keys
-- on identifier/route instead. Drop it.
ALTER TABLE IF EXISTS rate_limits DROP CONSTRAINT IF EXISTS user_or_ip_required;
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_route ON rate_limits (identifier, route, window_start);

-- 2. Application Cache Table (KV + TTL)
CREATE TABLE IF NOT EXISTS app_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '5 minutes',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_app_cache_expires_at ON app_cache (expires_at);

-- 3. Account Lockout Table
CREATE TABLE IF NOT EXISTS account_lockouts (
  email_hash TEXT PRIMARY KEY,
  failed_attempts INTEGER NOT NULL DEFAULT 1,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_locked_until ON account_lockouts (locked_until);

-- 4. NOTE: VG's feature_flags table uses a DIFFERENT schema than SF/AL
--    (id/name/description/is_enabled) and is managed by the app, so we do NOT
--    seed dispatch flags here. Absent redis_* flag => shouldUseRedis*() returns
--    false => PG path (the desired default).
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags (is_enabled) WHERE is_enabled = true;

-- 5. Rate Limit Check Function — new overload matching lib/security/pg-rate-limit.ts.
--    Uses the identifier/route columns; blocked requests do NOT insert (no
--    unbounded growth under flood).
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_route TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
  v_allowed BOOLEAN;
  v_remaining INTEGER;
  v_oldest TIMESTAMPTZ;
  v_reset_at TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  DELETE FROM rate_limits
  WHERE identifier = p_identifier
    AND route = p_route
    AND window_start < v_window_start;

  SELECT COUNT(*) INTO v_count
  FROM rate_limits
  WHERE identifier = p_identifier
    AND route = p_route
    AND window_start >= v_window_start;

  IF v_count < p_max_requests THEN
    INSERT INTO rate_limits (identifier, route, window_start)
    VALUES (p_identifier, p_route, NOW());
    v_count := v_count + 1;
    v_allowed := true;
  ELSE
    v_allowed := false;
  END IF;

  v_remaining := GREATEST(0, p_max_requests - v_count);

  SELECT MIN(window_start) INTO v_oldest
  FROM rate_limits
  WHERE identifier = p_identifier
    AND route = p_route
    AND window_start >= v_window_start;

  IF v_oldest IS NOT NULL THEN
    v_reset_at := v_oldest + (p_window_seconds || ' seconds')::INTERVAL;
  ELSE
    v_reset_at := NOW() + (p_window_seconds || ' seconds')::INTERVAL;
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining', v_remaining,
    'resetAt', floor(EXTRACT(EPOCH FROM v_reset_at))
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text,text,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text,text,integer,integer) TO service_role;

-- 6. Cleanup Function
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '2 hours';
  DELETE FROM account_lockouts WHERE locked_until IS NOT NULL AND locked_until < NOW();
  DELETE FROM app_cache WHERE expires_at < NOW();
END;
$$;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits() TO service_role;

-- 7. Account Lockout Functions
CREATE OR REPLACE FUNCTION check_account_lockout(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE v_hash TEXT; v_lockout RECORD; v_max_attempts INTEGER := 5;
BEGIN
  v_hash := encode(digest(p_email, 'sha256'), 'hex');
  SELECT * INTO v_lockout FROM account_lockouts WHERE email_hash = v_hash;
  IF v_lockout.locked_until IS NOT NULL AND v_lockout.locked_until > NOW() THEN
    RETURN jsonb_build_object('locked', true, 'remainingAttempts', 0, 'lockedUntil', v_lockout.locked_until);
  END IF;
  RETURN jsonb_build_object('locked', false, 'remainingAttempts', v_max_attempts - COALESCE(v_lockout.failed_attempts, 0));
END;
$$;
REVOKE EXECUTE ON FUNCTION public.check_account_lockout(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_account_lockout(text) TO service_role;

CREATE OR REPLACE FUNCTION record_failed_attempt(p_email TEXT, p_lockout_seconds INTEGER DEFAULT 900)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE v_hash TEXT; v_attempts INTEGER; v_max_attempts INTEGER := 5; v_locked BOOLEAN;
BEGIN
  v_hash := encode(digest(p_email, 'sha256'), 'hex');
  INSERT INTO account_lockouts (email_hash, failed_attempts) VALUES (v_hash, 1)
  ON CONFLICT (email_hash) DO UPDATE SET failed_attempts = account_lockouts.failed_attempts + 1
  RETURNING failed_attempts INTO v_attempts;
  IF v_attempts >= v_max_attempts THEN
    UPDATE account_lockouts SET locked_until = NOW() + (p_lockout_seconds || ' seconds')::INTERVAL WHERE email_hash = v_hash;
    v_locked := true;
  ELSE v_locked := false;
  END IF;
  RETURN jsonb_build_object('locked', v_locked, 'attempts', v_attempts, 'remaining', GREATEST(0, v_max_attempts - v_attempts));
END;
$$;
REVOKE EXECUTE ON FUNCTION public.record_failed_attempt(text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_failed_attempt(text,integer) TO service_role;

CREATE OR REPLACE FUNCTION reset_account_lockout(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE v_hash TEXT;
BEGIN v_hash := encode(digest(p_email, 'sha256'), 'hex'); DELETE FROM account_lockouts WHERE email_hash = v_hash; END;
$$;
REVOKE EXECUTE ON FUNCTION public.reset_account_lockout(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_account_lockout(text) TO service_role;

-- 8. Feature flag change notification trigger
CREATE OR REPLACE FUNCTION notify_feature_flag_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NOTIFY feature_flags_changed;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_feature_flags_changed ON feature_flags;
CREATE TRIGGER trg_feature_flags_changed
  AFTER INSERT OR UPDATE OR DELETE ON feature_flags
  FOR EACH STATEMENT
  EXECUTE FUNCTION notify_feature_flag_change();

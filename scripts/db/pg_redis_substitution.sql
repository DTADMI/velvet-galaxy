-- Migration: PostgreSQL Redis Substitution Layer
-- Replaces Upstash Redis for rate limiting, feature flags, and AI caching

CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,
  route TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON rate_limits (identifier, route, window_start);

CREATE TABLE IF NOT EXISTS feature_flags (
  name TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  type TEXT NOT NULL DEFAULT 'boolean',
  value JSONB,
  rules JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);
INSERT INTO feature_flags (name, enabled, type, value) VALUES ('pg_rate_limit', true, 'boolean', 'true'), ('pg_cache', false, 'boolean', 'false'), ('pg_flags', false, 'boolean', 'false'), ('pg_pubsub', false, 'boolean', 'false'), ('pg_session', false, 'boolean', 'false'), ('pg_lockout', false, 'boolean', 'false') ON CONFLICT (name) DO NOTHING;
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags (enabled) WHERE enabled = true;

CREATE TABLE IF NOT EXISTS app_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '5 minutes',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_app_cache_active ON app_cache (key) WHERE expires_at > NOW();

CREATE OR REPLACE FUNCTION check_rate_limit(p_identifier TEXT, p_route TEXT, p_max_requests INTEGER, p_window_seconds INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_window_start TIMESTAMPTZ; v_count INTEGER; v_allowed BOOLEAN; v_remaining INTEGER;
  v_oldest TIMESTAMPTZ; v_reset_at TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  DELETE FROM rate_limits WHERE identifier = p_identifier AND route = p_route AND window_start < v_window_start;
  INSERT INTO rate_limits (identifier, route, window_start) VALUES (p_identifier, p_route, NOW());
  SELECT COUNT(*) INTO v_count FROM rate_limits WHERE identifier = p_identifier AND route = p_route AND window_start >= v_window_start;
  v_allowed := v_count <= p_max_requests; v_remaining := GREATEST(0, p_max_requests - v_count);
  SELECT MIN(window_start) INTO v_oldest FROM rate_limits WHERE identifier = p_identifier AND route = p_route AND window_start >= v_window_start;
  IF v_oldest IS NOT NULL THEN v_reset_at := v_oldest + (p_window_seconds || ' seconds')::INTERVAL;
  ELSE v_reset_at := NOW() + (p_window_seconds || ' seconds')::INTERVAL; END IF;
  RETURN jsonb_build_object('allowed', v_allowed, 'remaining', v_remaining, 'resetAt', floor(EXTRACT(EPOCH FROM v_reset_at)));
END;
$$;
REVOKE EXECUTE ON FUNCTION check_rate_limit(text,text,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(text,text,integer,integer) TO service_role;

CREATE OR REPLACE FUNCTION cleanup_rate_limits() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$ BEGIN DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '2 hours'; DELETE FROM app_cache WHERE expires_at < NOW(); DELETE FROM account_lockouts WHERE locked_until IS NOT NULL AND locked_until < NOW(); END; $$;

-- Account Lockout
CREATE TABLE IF NOT EXISTS account_lockouts (
  email_hash TEXT PRIMARY KEY,
  failed_attempts INTEGER NOT NULL DEFAULT 1,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_locked ON account_lockouts (locked_until) WHERE locked_until > NOW();

CREATE OR REPLACE FUNCTION check_account_lockout(p_email TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
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
REVOKE EXECUTE ON FUNCTION check_account_lockout(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION check_account_lockout(text) TO service_role;

CREATE OR REPLACE FUNCTION record_failed_attempt(p_email TEXT, p_lockout_seconds INTEGER DEFAULT 900)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
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
REVOKE EXECUTE ON FUNCTION record_failed_attempt(text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_failed_attempt(text,integer) TO service_role;

CREATE OR REPLACE FUNCTION reset_account_lockout(p_email TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_hash TEXT;
BEGIN v_hash := encode(digest(p_email, 'sha256'), 'hex'); DELETE FROM account_lockouts WHERE email_hash = v_hash; END;
$$;
REVOKE EXECUTE ON FUNCTION reset_account_lockout(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION reset_account_lockout(text) TO service_role;

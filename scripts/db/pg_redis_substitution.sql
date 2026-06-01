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
INSERT INTO feature_flags (name, enabled, type, value) VALUES ('pg_rate_limit', true, 'boolean', 'true'), ('pg_flags', false, 'boolean', 'false'), ('pg_cache', false, 'boolean', 'false') ON CONFLICT (name) DO NOTHING;
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
AS $$ BEGIN DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '2 hours'; DELETE FROM app_cache WHERE expires_at < NOW(); END; $$;

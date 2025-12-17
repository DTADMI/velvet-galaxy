-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    user_id UUID REFERENCES auth.users
(
    id
) ON DELETE CASCADE,
    ip_address INET,
    action TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    created_at TIMESTAMPTZ DEFAULT NOW
(
),
    CONSTRAINT user_or_ip_required CHECK
(
    user_id
    IS
    NOT
    NULL
    OR
    ip_address
    IS
    NOT
    NULL
)
    );

-- Create indexes for faster lookups
CREATE INDEX idx_rate_limits_user_action ON rate_limits (user_id, action, window_start);
CREATE INDEX idx_rate_limits_ip_action ON rate_limits (ip_address, action, window_start);
CREATE INDEX idx_rate_limits_window ON rate_limits (window_start);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow service role to manage rate limits
CREATE
POLICY "Service role can manage rate limits" ON rate_limits
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Function to check rate limit
CREATE
OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_ip_address INET,
  p_action TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
v_count INTEGER;
  v_window_start
TIMESTAMPTZ;
BEGIN
  v_window_start
:= NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Clean up old entries
DELETE
FROM rate_limits
WHERE window_start < v_window_start;

-- Count requests in current window
SELECT COALESCE(SUM(count), 0)
INTO v_count
FROM rate_limits
WHERE action = p_action
  AND window_start >= v_window_start
  AND (
    (p_user_id IS NOT NULL
  AND user_id = p_user_id)
   OR
    (p_ip_address IS NOT NULL
  AND ip_address = p_ip_address)
    );

-- Check if limit exceeded
IF
v_count >= p_max_requests THEN
    RETURN FALSE;
END IF;
  
  -- Increment counter
INSERT INTO rate_limits (user_id, ip_address, action, count, window_start)
VALUES (p_user_id, p_ip_address, p_action, 1, NOW()) ON CONFLICT (id) DO NOTHING;

RETURN TRUE;
END;
$$
LANGUAGE plpgsql SECURITY DEFINER;

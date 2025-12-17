-- Add indexes for rate limiting performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON rate_limits(user_id, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_created_at ON rate_limits(created_at);

-- Add composite index for efficient cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON rate_limits(created_at, action);

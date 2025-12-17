-- Create subscriptions table for premium features
CREATE TABLE IF NOT EXISTS subscriptions
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    user_id UUID NOT NULL REFERENCES auth.users
(
    id
) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK
(
    tier
    IN
(
    'free',
    'week',
    'month',
    'year',
    'lifetime'
)),
    status TEXT NOT NULL DEFAULT 'active' CHECK
(
    status
    IN
(
    'active',
    'cancelled',
    'expired'
)),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    end_date TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT true,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ DEFAULT NOW
(
),
    UNIQUE
(
    user_id
)
    );

-- Create index for faster lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions (user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (status);
CREATE INDEX idx_subscriptions_tier ON subscriptions (tier);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscriptions
CREATE
POLICY "Users can view their own subscription" ON subscriptions
  FOR
SELECT USING (auth.uid() = user_id);

CREATE
POLICY "Users can insert their own subscription" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE
POLICY "Users can update their own subscription" ON subscriptions
  FOR
UPDATE USING (auth.uid() = user_id);

-- Function to check if user has premium access
CREATE
OR REPLACE FUNCTION has_premium_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
RETURN EXISTS (SELECT 1
               FROM subscriptions
               WHERE user_id = user_uuid
                 AND status = 'active'
                 AND tier IN ('week', 'month', 'year', 'lifetime')
                 AND (end_date IS NULL OR end_date > NOW()));
END;
$$
LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check subscription tier
CREATE
OR REPLACE FUNCTION get_subscription_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
user_tier TEXT;
BEGIN
SELECT tier
INTO user_tier
FROM subscriptions
WHERE user_id = user_uuid
  AND status = 'active'
  AND (end_date IS NULL OR end_date > NOW());

RETURN COALESCE(user_tier, 'free');
END;
$$
LANGUAGE plpgsql SECURITY DEFINER;

-- Create default free subscription for all existing users
INSERT INTO subscriptions (user_id, tier, status, start_date)
SELECT id, 'free', 'active', NOW()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM subscriptions) ON CONFLICT (user_id) DO NOTHING;

-- Migration: push_subscriptions table
-- Idempotent: safe to re-run
DO $$ BEGIN
    CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        subscription JSONB NOT NULL,
        active BOOLEAN DEFAULT true,
        deactivated_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );
EXCEPTION WHEN duplicate_table THEN null;
END $$;

ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS endpoint TEXT NOT NULL;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS subscription JSONB NOT NULL;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(active);

DO $$ BEGIN
    ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL;

GRANT SELECT, INSERT, UPDATE, DELETE ON push_subscriptions TO authenticated;

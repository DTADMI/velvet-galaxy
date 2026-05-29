-- Rollback: 068_push_subscriptions.rollback.sql
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON push_subscriptions;
DROP TABLE IF EXISTS push_subscriptions CASCADE;

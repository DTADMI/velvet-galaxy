-- Fix RLS policies for groups, conversations, and notifications

-- Drop and recreate groups insert policy to be more permissive
DROP
POLICY IF EXISTS "groups_insert_own" ON groups;
CREATE
POLICY "groups_insert_authenticated" ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add missing INSERT policy for notifications
DROP
POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE
POLICY "notifications_insert" ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure conversations can be created by authenticated users
DROP
POLICY IF EXISTS "conversations_insert_authenticated" ON conversations;
CREATE
POLICY "conversations_insert_authenticated" ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

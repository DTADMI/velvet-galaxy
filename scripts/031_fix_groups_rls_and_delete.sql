-- Fix RLS policies for groups to allow creators to update and delete their groups

-- Added DROP POLICY IF EXISTS to prevent duplicate policy errors
-- Drop existing update policy
DROP
POLICY IF EXISTS "groups_update_admin" ON groups;
DROP
POLICY IF EXISTS "groups_update_creator_or_admin" ON groups;

-- Create new update policy for creators and admins
CREATE
POLICY "groups_update_creator_or_admin" ON groups
  FOR
UPDATE
    USING (
    auth.uid() = creator_id OR
    EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = id AND user_id = auth.uid() AND role = 'admin'
    )
    );

-- Added DROP POLICY IF EXISTS to prevent duplicate policy errors
-- Add delete policy for creators
DROP
POLICY IF EXISTS "groups_delete_creator" ON groups;
CREATE
POLICY "groups_delete_creator" ON groups
  FOR DELETE
USING (auth.uid() = creator_id);

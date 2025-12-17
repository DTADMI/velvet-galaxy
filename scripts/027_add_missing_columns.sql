-- Add created_by column to conversations table
ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- Update RLS policy for conversations to allow authenticated users to create
DROP
POLICY IF EXISTS "conversations_insert_authenticated" ON conversations;
CREATE
POLICY "conversations_insert_authenticated"
ON conversations FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Ensure groups RLS policy allows insert
DROP
POLICY IF EXISTS "groups_insert_own" ON groups;
CREATE
POLICY "groups_insert_own"
ON groups FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = creator_id);

-- Fix bookmarks RLS to prevent 406 errors
DROP
POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
CREATE
POLICY "Users can view own bookmarks"
ON bookmarks FOR
SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_post ON bookmarks(user_id, post_id);

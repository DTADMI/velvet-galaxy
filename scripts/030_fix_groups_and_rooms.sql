-- Fix RLS policies for groups to allow authenticated users to create groups
-- Added DROP POLICY IF EXISTS to prevent duplicate policy errors
DROP
POLICY IF EXISTS "groups_insert_own" ON groups;
DROP
POLICY IF EXISTS "groups_insert_authenticated" ON groups;

CREATE
POLICY "groups_insert_authenticated" ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- Add created_by column to conversations table for tracking room creators
ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- Update existing conversations to set created_by from conversation_participants
-- (assuming the first participant is the creator)
UPDATE conversations c
SET created_by = (SELECT user_id
                  FROM conversation_participants
                  WHERE conversation_id = c.id
                  ORDER BY joined_at ASC
    LIMIT 1
    )
WHERE created_by IS NULL AND is_chat_room = true;

-- Added DROP POLICY IF EXISTS to prevent duplicate policy errors
-- Add RLS policy for conversations to allow creators to update their rooms
DROP
POLICY IF EXISTS "conversations_update_creator" ON conversations;
CREATE
POLICY "conversations_update_creator" ON conversations
  FOR
UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

-- Add RLS policy for conversations to allow creators to delete their rooms
DROP
POLICY IF EXISTS "conversations_delete_creator" ON conversations;
CREATE
POLICY "conversations_delete_creator" ON conversations
  FOR DELETE
TO authenticated
  USING (auth.uid() = created_by);

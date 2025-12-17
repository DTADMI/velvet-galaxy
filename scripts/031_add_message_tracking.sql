-- Add columns for message tracking
ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(is_archived, archived_by);

-- Add RLS policy for updating message read status
CREATE
POLICY "users_can_mark_messages_read" ON messages
  FOR
UPDATE
    TO authenticated
    USING (
    EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND user_id = auth.uid()
    )
    );

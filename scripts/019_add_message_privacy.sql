-- Add message privacy settings to profiles
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS message_privacy TEXT DEFAULT 'everyone';
-- Options: 'everyone', 'followers', 'friends', 'nobody'

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS dating_messages_enabled BOOLEAN DEFAULT true;

-- Add message type to conversations
ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'normal';
-- Options: 'normal', 'dating', 'group'

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_message_privacy ON profiles(message_privacy);
CREATE INDEX IF NOT EXISTS idx_conversations_message_type ON conversations(message_type);

-- Add RLS policies for message privacy
DROP
POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
CREATE
POLICY "Users can view conversations they participate in"
  ON conversations FOR
SELECT
    USING (
    id IN (
    SELECT conversation_id
    FROM conversation_participants
    WHERE user_id = auth.uid()
    )
    );

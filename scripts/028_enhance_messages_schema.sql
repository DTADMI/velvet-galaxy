-- Add message archiving and read status
ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS subject TEXT;

-- Add read receipts table
CREATE TABLE IF NOT EXISTS message_read_receipts
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    message_id UUID REFERENCES messages
(
    id
) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles
(
    id
)
  ON DELETE CASCADE,
    read_at TIMESTAMP
  WITH TIME ZONE DEFAULT NOW(),
    UNIQUE
(
    message_id,
    user_id
)
    );

-- Add RLS policies for read receipts
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

CREATE
POLICY "Users can view read receipts for their messages"
  ON message_read_receipts FOR
SELECT
    USING (
    user_id = auth.uid() OR
    EXISTS (
    SELECT 1 FROM messages
    WHERE messages.id = message_read_receipts.message_id
    AND messages.sender_id = auth.uid()
    )
    );

CREATE
POLICY "Users can create read receipts"
  ON message_read_receipts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Add group message settings
ALTER TABLE groups
    ADD COLUMN IF NOT EXISTS allow_messages BOOLEAN DEFAULT TRUE;

-- Add message preferences to profiles
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS allow_group_messages BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS allow_promotional_messages BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS allow_organization_messages BOOLEAN DEFAULT TRUE;

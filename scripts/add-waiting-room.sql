-- Create waiting room table for chat rooms
CREATE TABLE IF NOT EXISTS public.room_waiting_list
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    conversation_id UUID NOT NULL REFERENCES public.conversations
(
    id
) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles
(
    id
)
  ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK
(
    status
    IN
(
    'pending',
    'approved',
    'denied'
)),
    created_at TIMESTAMP
  WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP
  WITH TIME ZONE,
      reviewed_by UUID REFERENCES public.profiles(id),
    UNIQUE
(
    conversation_id,
    user_id
)
    );

-- Enable RLS
ALTER TABLE public.room_waiting_list ENABLE ROW LEVEL SECURITY;

-- Policies for waiting room
CREATE
POLICY "Users can view their own waiting room entries"
  ON public.room_waiting_list
  FOR
SELECT
    USING (auth.uid() = user_id);

CREATE
POLICY "Room creators can view waiting list"
  ON public.room_waiting_list
  FOR
SELECT
    USING (
    EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = room_waiting_list.conversation_id
    AND conversations.created_by = auth.uid()
    )
    );

CREATE
POLICY "Users can join waiting room"
  ON public.room_waiting_list
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE
POLICY "Room creators can update waiting list"
  ON public.room_waiting_list
  FOR
UPDATE
    USING (
    EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = room_waiting_list.conversation_id
    AND conversations.created_by = auth.uid()
    )
    );

CREATE
POLICY "Users can delete their own waiting room entries"
  ON public.room_waiting_list
  FOR DELETE
USING (auth.uid() = user_id);

-- Add requires_approval field to conversations
ALTER TABLE public.conversations
    ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_room_waiting_list_conversation ON public.room_waiting_list(conversation_id);
CREATE INDEX IF NOT EXISTS idx_room_waiting_list_user ON public.room_waiting_list(user_id);
CREATE INDEX IF NOT EXISTS idx_room_waiting_list_status ON public.room_waiting_list(status);

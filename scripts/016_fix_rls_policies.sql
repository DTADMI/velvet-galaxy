-- Fix infinite recursion in conversation_participants RLS policy
DROP
POLICY IF EXISTS "participants_select_own" ON public.conversation_participants;

-- Simplified policy to avoid infinite recursion
CREATE
POLICY "participants_select_own"
  ON public.conversation_participants FOR
SELECT
    USING (user_id = auth.uid());

-- Add policy to allow viewing other participants in same conversation
CREATE
POLICY "participants_select_same_conversation"
  ON public.conversation_participants FOR
SELECT
    USING (
    conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE user_id = auth.uid()
    )
    );

-- Fix conversations policy to work with chat rooms
DROP
POLICY IF EXISTS "conversations_select_participant" ON public.conversations;

CREATE
POLICY "conversations_select_participant"
  ON public.conversations FOR
SELECT
    USING (
    -- Allow if user is a participant
    id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE user_id = auth.uid()
    )
    OR
    -- Allow if it's a public chat room
    (is_chat_room = true AND is_public = true)
    );

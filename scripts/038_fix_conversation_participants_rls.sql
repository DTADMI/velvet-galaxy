-- Fix conversation_participants RLS to allow authenticated users to add participants

-- Drop both old and new policy names to avoid conflicts
DROP
POLICY IF EXISTS "participants_insert" ON public.conversation_participants;
DROP
POLICY IF EXISTS "participants_insert_authenticated" ON public.conversation_participants;

-- Allow authenticated users to insert conversation participants
CREATE
POLICY "participants_insert_authenticated"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

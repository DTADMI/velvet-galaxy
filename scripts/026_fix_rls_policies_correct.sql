-- Fix RLS policies for groups and conversations
-- This script corrects the previous attempt that referenced non-existent columns

-- First, let's ensure the conversations insert policy is correct
-- The conversations table doesn't have a created_by column, so we just allow authenticated users to insert
DROP
POLICY IF EXISTS "conversations_insert_authenticated" ON public.conversations;

CREATE
POLICY "conversations_insert_authenticated"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- For groups, the existing policy should work, but let's recreate it to be sure
-- Groups table has creator_id column
DROP
POLICY IF EXISTS "groups_insert_own" ON public.groups;

CREATE
POLICY "groups_insert_own"
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- Ensure conversation_participants can be inserted by authenticated users
DROP
POLICY IF EXISTS "participants_insert_authenticated" ON public.conversation_participants;

CREATE
POLICY "participants_insert_authenticated"
  ON public.conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ensure chat_room_settings can be inserted
DROP
POLICY IF EXISTS "chat_room_settings_insert_authenticated" ON public.chat_room_settings;

CREATE
POLICY "chat_room_settings_insert_authenticated"
  ON public.chat_room_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = chat_room_settings.conversation_id 
      AND user_id = auth.uid()
    )
  );

-- Ensure group_members can be inserted
DROP
POLICY IF EXISTS "group_members_insert_authenticated" ON public.group_members;

CREATE
POLICY "group_members_insert_authenticated"
  ON public.group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

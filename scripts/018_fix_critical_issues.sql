-- Fix conversation_participants RLS to prevent infinite recursion
DROP
POLICY IF EXISTS "participants_select_own" ON public.conversation_participants;
DROP
POLICY IF EXISTS "participants_select_same_conversation" ON public.conversation_participants;
DROP
POLICY IF EXISTS "participants_insert_own" ON public.conversation_participants;
DROP
POLICY IF EXISTS "participants_delete_own" ON public.conversation_participants;

-- Create simple, non-recursive policies
CREATE
POLICY "participants_select"
  ON public.conversation_participants FOR
SELECT
    USING (true);

CREATE
POLICY "participants_insert"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE
POLICY "participants_delete"
  ON public.conversation_participants FOR DELETE
USING (user_id = auth.uid());

-- Fix conversations RLS
DROP
POLICY IF EXISTS "conversations_select_participant" ON public.conversations;
DROP
POLICY IF EXISTS "conversations_insert_own" ON public.conversations;
DROP
POLICY IF EXISTS "conversations_update_participant" ON public.conversations;

CREATE
POLICY "conversations_select"
  ON public.conversations FOR
SELECT
    USING (true);

CREATE
POLICY "conversations_insert"
  ON public.conversations FOR INSERT
  WITH CHECK (true);

CREATE
POLICY "conversations_update"
  ON public.conversations FOR
UPDATE
    USING (true);

-- Ensure event_responses table exists with correct schema
CREATE TABLE IF NOT EXISTS public.event_responses
(
    id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    event_id uuid not null references public.events
(
    id
) on delete cascade,
    user_id uuid not null references public.profiles
(
    id
)
  on delete cascade,
    response text not null check
(
    response
    in
(
    'going',
    'interested',
    'not_going'
)),
    created_at timestamp
  with time zone default now(),
    updated_at timestamp
  with time zone default now(),
    unique
(
    event_id,
    user_id
)
    );

-- Enable RLS if not already enabled
ALTER TABLE public.event_responses ENABLE ROW LEVEL SECURITY;

-- Drop and recreate event_responses policies
DROP
POLICY IF EXISTS "event_responses_select_all" ON public.event_responses;
DROP
POLICY IF EXISTS "event_responses_insert_own" ON public.event_responses;
DROP
POLICY IF EXISTS "event_responses_update_own" ON public.event_responses;
DROP
POLICY IF EXISTS "event_responses_delete_own" ON public.event_responses;

CREATE
POLICY "event_responses_select"
  ON public.event_responses FOR
SELECT
    USING (true);

CREATE
POLICY "event_responses_insert"
  ON public.event_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE
POLICY "event_responses_update"
  ON public.event_responses FOR
UPDATE
    USING (auth.uid() = user_id);

CREATE
POLICY "event_responses_delete"
  ON public.event_responses FOR DELETE
USING (auth.uid() = user_id);

-- Create friendships table for friend system
CREATE TABLE IF NOT EXISTS public.friendships
(
    id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    user_id uuid not null references public.profiles
(
    id
) on delete cascade,
    friend_id uuid not null references public.profiles
(
    id
)
  on delete cascade,
    status text not null check
(
    status
    in
(
    'pending',
    'accepted',
    'rejected'
)) default 'pending',
    created_at timestamp
  with time zone default now(),
    updated_at timestamp
  with time zone default now(),
    unique
(
    user_id,
    friend_id
)
    );

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE
POLICY "friendships_select"
  ON public.friendships FOR
SELECT
    USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE
POLICY "friendships_insert"
  ON public.friendships FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE
POLICY "friendships_update"
  ON public.friendships FOR
UPDATE
    USING (friend_id = auth.uid());

CREATE
POLICY "friendships_delete"
  ON public.friendships FOR DELETE
USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- Create tags table for content tagging
CREATE TABLE IF NOT EXISTS public.tags
(
    id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    name text not null unique,
    created_at timestamp with time zone default now()
    );

CREATE TABLE IF NOT EXISTS public.post_tags
(
    id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    post_id uuid not null references public.posts
(
    id
) on delete cascade,
    tag_id uuid not null references public.tags
(
    id
)
  on delete cascade,
    created_at timestamp
  with time zone default now(),
    unique
(
    post_id,
    tag_id
)
    );

CREATE TABLE IF NOT EXISTS public.user_tag_preferences
(
    id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    user_id uuid not null references public.profiles
(
    id
) on delete cascade,
    tag_id uuid not null references public.tags
(
    id
)
  on delete cascade,
    created_at timestamp
  with time zone default now(),
    unique
(
    user_id,
    tag_id
)
    );

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tag_preferences ENABLE ROW LEVEL SECURITY;

CREATE
POLICY "tags_select" ON public.tags FOR
SELECT USING (true);
CREATE
POLICY "tags_insert" ON public.tags FOR INSERT WITH CHECK (true);

CREATE
POLICY "post_tags_select" ON public.post_tags FOR
SELECT USING (true);
CREATE
POLICY "post_tags_insert" ON public.post_tags FOR INSERT WITH CHECK (true);
CREATE
POLICY "post_tags_delete" ON public.post_tags FOR DELETE
USING (true);

CREATE
POLICY "user_tag_preferences_select" ON public.user_tag_preferences FOR
SELECT USING (user_id = auth.uid());
CREATE
POLICY "user_tag_preferences_insert" ON public.user_tag_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE
POLICY "user_tag_preferences_delete" ON public.user_tag_preferences FOR DELETE
USING (user_id = auth.uid());

-- Create activities table for activity feed
CREATE TABLE IF NOT EXISTS public.activities
(
    id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    user_id uuid not null references public.profiles
(
    id
) on delete cascade,
    activity_type text not null check
(
    activity_type
    in
(
    'post',
    'like',
    'comment',
    'follow',
    'friend',
    'group_join',
    'event_join'
)),
    target_id uuid,
    target_type text,
    metadata jsonb,
    created_at timestamp
  with time zone default now()
    );

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE
POLICY "activities_select" ON public.activities FOR
SELECT USING (true);
CREATE
POLICY "activities_insert" ON public.activities FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_target ON public.activities(target_id, target_type);

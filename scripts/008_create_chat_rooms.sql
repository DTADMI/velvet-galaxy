-- Update conversations table to support chat rooms
alter table public.conversations
    add column if not exists is_chat_room boolean default false,
    add column if not exists room_type text default 'text',
    add column if not exists max_participants integer,
    add column if not exists is_public boolean default true;

-- Add constraint after column exists
do
$$
begin
  if
not exists (
    select 1 from pg_constraint 
    where conname = 'conversations_room_type_check'
  ) then
alter table public.conversations
    add constraint conversations_room_type_check
        check (room_type in ('text', 'audio', 'video'));
end if;
end $$;

-- Create chat_room_settings table for additional room configurations
create table if not exists public.chat_room_settings
(
    id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    conversation_id uuid not null references public.conversations
(
    id
) on delete cascade unique,
    description text,
    tags text[],
    created_at timestamp
  with time zone default now(),
    updated_at timestamp
  with time zone default now()
    );

-- Enable RLS
alter table public.chat_room_settings enable row level security;

-- Drop existing policies before creating them to avoid conflicts
drop
policy if exists "chat_room_settings_select_all" on public.chat_room_settings;
drop
policy if exists "chat_room_settings_insert_participant" on public.chat_room_settings;
drop
policy if exists "chat_room_settings_update_participant" on public.chat_room_settings;

-- RLS Policies for chat_room_settings
create
policy "chat_room_settings_select_all"
  on public.chat_room_settings for
select
    using (true);

create
policy "chat_room_settings_insert_participant"
  on public.chat_room_settings for insert
  with check (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = chat_room_settings.conversation_id and user_id = auth.uid()
    )
  );

create
policy "chat_room_settings_update_participant"
  on public.chat_room_settings for
update
    using (
    exists (
    select 1 from public.conversation_participants cp
    join public.conversations c on c.id = cp.conversation_id
    where cp.conversation_id = chat_room_settings.conversation_id
    and cp.user_id = auth.uid()
    and c.is_chat_room = true
    )
    );

-- Update RLS policy for conversations to include chat rooms
drop
policy if exists "conversations_select_participant" on public.conversations;

create
policy "conversations_select_participant"
  on public.conversations for
select
    using (
    is_public = true or
    exists (
    select 1 from public.conversation_participants
    where conversation_id = id and user_id = auth.uid()
    )
    );

-- Create indexes
create index if not exists idx_conversations_is_chat_room on public.conversations(is_chat_room);
create index if not exists idx_conversations_room_type on public.conversations(room_type);
create index if not exists idx_chat_room_settings_conversation_id on public.chat_room_settings(conversation_id);

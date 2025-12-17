-- Create conversations table
create table if not exists public.conversations
(
    id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    type text not null check
(
    type
    in
(
    'normal',
    'dating',
    'group'
)),
    name text,
    created_at timestamp with time zone default now(),
    updated_at timestamp
                         with time zone default now()
    );

-- Create conversation participants table
create table if not exists public.conversation_participants
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
) on delete cascade,
    user_id uuid not null references public.profiles
(
    id
)
  on delete cascade,
    joined_at timestamp
  with time zone default now(),
    unique
(
    conversation_id,
    user_id
)
    );

-- Create messages table
create table if not exists public.messages
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
) on delete cascade,
    sender_id uuid not null references public.profiles
(
    id
)
  on delete cascade,
    content text not null,
    created_at timestamp
  with time zone default now()
    );

-- Enable RLS
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- RLS Policies for conversations
create
policy "conversations_select_participant"
  on public.conversations for
select
    using (
    exists (
    select 1 from public.conversation_participants
    where conversation_id = id and user_id = auth.uid()
    )
    );

create
policy "conversations_insert_own"
  on public.conversations for insert
  with check (true);

-- RLS Policies for conversation_participants
create
policy "participants_select_own"
  on public.conversation_participants for
select
    using (
    user_id = auth.uid() or
    exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
    )
    );

create
policy "participants_insert_own"
  on public.conversation_participants for insert
  with check (true);

-- RLS Policies for messages
create
policy "messages_select_participant"
  on public.messages for
select
    using (
    exists (
    select 1 from public.conversation_participants
    where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
    );

create
policy "messages_insert_participant"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

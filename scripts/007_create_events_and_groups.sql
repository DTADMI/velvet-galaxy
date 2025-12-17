-- Create groups table
create table if not exists public.groups
(
    id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    name text not null,
    description text,
    image_url text,
    creator_id uuid not null references public.profiles
(
    id
) on delete cascade,
    is_private boolean default false,
    created_at timestamp
  with time zone default now(),
    updated_at timestamp
  with time zone default now()
    );

-- Create group_members table
create table if not exists public.group_members
(
    id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    group_id uuid not null references public.groups
(
    id
) on delete cascade,
    user_id uuid not null references public.profiles
(
    id
)
  on delete cascade,
    role text not null check
(
    role
    in
(
    'admin',
    'moderator',
    'member'
)) default 'member',
    joined_at timestamp
  with time zone default now(),
    unique
(
    group_id,
    user_id
)
    );

-- Create events table
create table if not exists public.events
(
    id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    title text not null,
    description text,
    image_url text,
    location text,
    start_date timestamp with time zone not null,
    end_date timestamp with time zone,
                           creator_id uuid not null references public.profiles(id)
                       on delete cascade,
    group_id uuid references public.groups
(
    id
)
                       on delete cascade,
    is_online boolean default false,
    created_at timestamp
                       with time zone default now(),
    updated_at timestamp
                       with time zone default now()
    );

-- Create event_responses table
create table if not exists public.event_responses
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

-- Enable RLS
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.events enable row level security;
alter table public.event_responses enable row level security;

-- RLS Policies for groups
create
policy "groups_select_all"
  on public.groups for
select
    using (
    not is_private or
    exists (
    select 1 from public.group_members
    where group_id = id and user_id = auth.uid()
    )
    );

create
policy "groups_insert_own"
  on public.groups for insert
  with check (auth.uid() = creator_id);

create
policy "groups_update_admin"
  on public.groups for
update
    using (
    exists (
    select 1 from public.group_members
    where group_id = id and user_id = auth.uid() and role = 'admin'
    )
    );

-- RLS Policies for group_members
create
policy "group_members_select_all"
  on public.group_members for
select
    using (true);

create
policy "group_members_insert_own"
  on public.group_members for insert
  with check (auth.uid() = user_id);

create
policy "group_members_delete_own"
  on public.group_members for delete
using (auth.uid() = user_id);

-- RLS Policies for events
create
policy "events_select_all"
  on public.events for
select
    using (true);

create
policy "events_insert_own"
  on public.events for insert
  with check (auth.uid() = creator_id);

create
policy "events_update_own"
  on public.events for
update
    using (auth.uid() = creator_id);

create
policy "events_delete_own"
  on public.events for delete
using (auth.uid() = creator_id);

-- RLS Policies for event_responses
create
policy "event_responses_select_all"
  on public.event_responses for
select
    using (true);

create
policy "event_responses_insert_own"
  on public.event_responses for insert
  with check (auth.uid() = user_id);

create
policy "event_responses_update_own"
  on public.event_responses for
update
    using (auth.uid() = user_id);

create
policy "event_responses_delete_own"
  on public.event_responses for delete
using (auth.uid() = user_id);

-- Create indexes
create index if not exists idx_groups_creator_id on public.groups(creator_id);
create index if not exists idx_group_members_group_id on public.group_members(group_id);
create index if not exists idx_group_members_user_id on public.group_members(user_id);
create index if not exists idx_events_creator_id on public.events(creator_id);
create index if not exists idx_events_group_id on public.events(group_id);
create index if not exists idx_events_start_date on public.events(start_date);
create index if not exists idx_event_responses_event_id on public.event_responses(event_id);
create index if not exists idx_event_responses_user_id on public.event_responses(user_id);

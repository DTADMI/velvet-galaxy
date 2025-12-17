-- Create relationships table with custom types
create table if not exists public.relationships
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
    related_user_id uuid not null references public.profiles
(
    id
)
  on delete cascade,
    relationship_type text not null check
(
    relationship_type
    in
(
    'friend',
    'partner',
    'crush',
    'admirer',
    'mentor',
    'mentee',
    'play_partner',
    'romantic_interest',
    'ex',
    'family',
    'other'
)),
    status text not null check
(
    status
    in
(
    'pending',
    'accepted',
    'declined'
)) default 'pending',
    custom_label text,
    is_visible boolean default true,
    created_at timestamp
  with time zone default now(),
    updated_at timestamp
  with time zone default now(),
    unique
(
    user_id,
    related_user_id,
    relationship_type
)
    );

-- Enable RLS
alter table public.relationships enable row level security;

-- RLS Policies for relationships
create
policy "relationships_select_own"
  on public.relationships for
select
    using (
    auth.uid() = user_id or
    auth.uid() = related_user_id or
    (is_visible = true and status = 'accepted')
    );

create
policy "relationships_insert_own"
  on public.relationships for insert
  with check (auth.uid() = user_id);

create
policy "relationships_update_own"
  on public.relationships for
update
    using (auth.uid() = user_id or auth.uid() = related_user_id);

create
policy "relationships_delete_own"
  on public.relationships for delete
using (auth.uid() = user_id or auth.uid() = related_user_id);

-- Create indexes
create index if not exists idx_relationships_user_id on public.relationships(user_id);
create index if not exists idx_relationships_related_user_id on public.relationships(related_user_id);
create index if not exists idx_relationships_status on public.relationships(status);
create index if not exists idx_relationships_type on public.relationships(relationship_type);

-- Velvet Galaxy - Social Extensions Schema

-- Update profiles for account types and verification
do
$$
begin
    if
not exists (select 1 from pg_type where typname = 'account_type') then
create type account_type as enum ('physical', 'moral');
end if;
end $$;

alter table public.profiles
    add column if not exists account_type account_type default 'physical',
    add column if not exists is_verified boolean default false,
    add column if not exists verification_image_url text,
    add column if not exists pronouns text;

-- Post scoping: Who can comment
do
$$
begin
    if
not exists (select 1 from pg_type where typname = 'post_scope') then
create type post_scope as enum ('everyone', 'friends', 'followers');
end if;
end $$;

alter table public.posts
    add column if not exists comment_scope post_scope default 'everyone';

-- Verification requests table
create table if not exists public.verification_requests
(
    id
    uuid
    primary
    key
    default
    uuid_generate_v4
(
),
    user_id uuid not null references public.profiles
(
    id
) on delete cascade,
    image_url text not null,
    status text check
(
    status
    in
(
    'pending',
    'approved',
    'rejected'
)) default 'pending',
    reviewer_notes text,
    created_at timestamptz not null default now
(
),
    updated_at timestamptz not null default now
(
)
    );

-- RLS for verification requests
alter table public.verification_requests enable row level security;

create
policy "Users can view own verification requests"
on public.verification_requests for
select
    using (auth.uid() = user_id);

create
policy "Users can submit verification requests"
on public.verification_requests for insert
with check (auth.uid() = user_id);

-- Profile privacy settings for messaging
alter table public.profiles
    add column if not exists message_privacy_scope post_scope default 'everyone',
    add column if not exists allow_dating_messages boolean default true;

-- Velvet Galaxy - Initial Supabase Schema
-- This schema captures the core entities used by the app today.
-- Notes:
-- - RLS policies are provided as examples and should be reviewed and enabled per environment.
-- - Use with: psql or Supabase SQL editor.

-- Extensions (enable if not already)
create
extension if not exists "uuid-ossp";

-- Profiles
create table if not exists public.profiles
(
    id
    uuid
    primary
    key
    default
    uuid_generate_v4
(
),
    username text unique not null,
    display_name text,
    avatar_url text,
    bio text,
    created_at timestamptz not null default now
(
)
    );

-- Posts
create table if not exists public.posts
(
    id
    uuid
    primary
    key
    default
    uuid_generate_v4
(
),
    author_id uuid not null references public.profiles
(
    id
) on delete cascade,
    content text,
    created_at timestamptz not null default now
(
)
    );

-- Media (images/videos)
create table if not exists public.media
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
    post_id uuid references public.posts
(
    id
)
  on delete set null,
    url text not null,
    type text check
(
    type
    in
(
    'image',
    'video'
)) not null,
    created_at timestamptz not null default now
(
)
    );

-- Follows
create table if not exists public.follows
(
    follower_id
    uuid
    not
    null
    references
    public
    .
    profiles
(
    id
) on delete cascade,
    following_id uuid not null references public.profiles
(
    id
)
  on delete cascade,
    created_at timestamptz not null default now
(
),
    primary key
(
    follower_id,
    following_id
)
    );

-- Friendships
create type if not exists friendship_status as enum ('pending','accepted','blocked');
create table if not exists public.friendships
(
    user_id
    uuid
    not
    null
    references
    public
    .
    profiles
(
    id
) on delete cascade,
    friend_id uuid not null references public.profiles
(
    id
)
  on delete cascade,
    status friendship_status not null default 'pending',
    created_at timestamptz not null default now
(
),
    primary key
(
    user_id,
    friend_id
)
    );

-- Activities
create table if not exists public.activities
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
    activity_type text not null,
    target_id uuid,
    target_type text,
    content text,
    created_at timestamptz not null default now
(
)
    );

-- Notifications
create table if not exists public.notifications
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
    from_user_id uuid references public.profiles
(
    id
)
  on delete set null,
    type text not null,
    title text,
    message text not null,
    link text,
    read boolean not null default false,
    created_at timestamptz not null default now
(
)
    );

-- Conversations (messages)
create table if not exists public.conversations
(
    id
    uuid
    primary
    key
    default
    uuid_generate_v4
(
),
    created_at timestamptz not null default now
(
)
    );

create table if not exists public.conversation_participants
(
    conversation_id
    uuid
    not
    null
    references
    public
    .
    conversations
(
    id
) on delete cascade,
    user_id uuid not null references public.profiles
(
    id
)
  on delete cascade,
    joined_at timestamptz not null default now
(
),
    primary key
(
    conversation_id,
    user_id
)
    );

create table if not exists public.messages
(
    id
    uuid
    primary
    key
    default
    uuid_generate_v4
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
    created_at timestamptz not null default now
(
)
    );

-- Groups
create table if not exists public.groups
(
    id
    uuid
    primary
    key
    default
    uuid_generate_v4
(
),
    creator_id uuid not null references public.profiles
(
    id
) on delete cascade,
    name text not null,
    description text,
    created_at timestamptz not null default now
(
)
    );

create type if not exists group_role as enum ('member','moderator','admin');
create table if not exists public.group_members
(
    group_id
    uuid
    not
    null
    references
    public
    .
    groups
(
    id
) on delete cascade,
    user_id uuid not null references public.profiles
(
    id
)
  on delete cascade,
    role group_role not null default 'member',
    joined_at timestamptz not null default now
(
),
    primary key
(
    group_id,
    user_id
)
    );

-- Events
create table if not exists public.events
(
    id
    uuid
    primary
    key
    default
    uuid_generate_v4
(
),
    creator_id uuid not null references public.profiles
(
    id
) on delete cascade,
    group_id uuid references public.groups
(
    id
)
  on delete set null,
    title text not null,
    description text,
    starts_at timestamptz not null,
    ends_at timestamptz,
    location text,
    created_at timestamptz not null default now
(
)
    );

create type if not exists event_response as enum ('going','interested','not_going');
create table if not exists public.event_attendees
(
    event_id
    uuid
    not
    null
    references
    public
    .
    events
(
    id
) on delete cascade,
    user_id uuid not null references public.profiles
(
    id
)
  on delete cascade,
    response event_response not null default 'interested',
    responded_at timestamptz not null default now
(
),
    primary key
(
    event_id,
    user_id
)
    );

-- Likes (for posts/media)
create table if not exists public.likes
(
    user_id
    uuid
    not
    null
    references
    public
    .
    profiles
(
    id
) on delete cascade,
    post_id uuid references public.posts
(
    id
)
  on delete cascade,
    media_id uuid references public.media
(
    id
)
  on delete cascade,
    created_at timestamptz not null default now
(
),
    check
(
(
    post_id
    is
    not
    null
) <>
(
    media_id
    is
    not
    null
)),
    primary key
(
    user_id,
    post_id,
    media_id
)
    );

-- Basic helpful indexes
create index if not exists idx_activities_user_created on public.activities(user_id, created_at desc);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);
create index if not exists idx_posts_author_created on public.posts(author_id, created_at desc);
create index if not exists idx_media_user_created on public.media(user_id, created_at desc);
create index if not exists idx_messages_conv_created on public.messages(conversation_id, created_at desc);

-- Example RLS policies (DISABLED by default here; enable as needed)
-- alter table public.profiles enable row level security;
-- create policy "profiles_select_self_public" on public.profiles for select using (true);

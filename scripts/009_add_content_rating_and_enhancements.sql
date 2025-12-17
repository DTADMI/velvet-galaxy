-- Add content_rating to posts
alter table public.posts
    add column if not exists content_rating text check (content_rating in ('sfw', 'nsfw')) default 'sfw';
alter table public.posts
    add column if not exists media_type text check (media_type in ('status', 'picture', 'gif', 'video', 'audio', 'writing'));
alter table public.posts
    add column if not exists media_url text;

-- Add content_rating to media_items
alter table public.media_items
    add column if not exists content_rating text check (content_rating in ('sfw', 'nsfw')) default 'sfw';

-- Add content_rating to events
alter table public.events
    add column if not exists content_rating text check (content_rating in ('sfw', 'nsfw')) default 'sfw';

-- Add content_rating to groups
alter table public.groups
    add column if not exists content_rating text check (content_rating in ('sfw', 'nsfw')) default 'sfw';

-- Add latitude and longitude to profiles for location-based filtering
alter table public.profiles
    add column if not exists latitude numeric;
alter table public.profiles
    add column if not exists longitude numeric;

-- Add latitude and longitude to events for location-based filtering
alter table public.events
    add column if not exists latitude numeric;
alter table public.events
    add column if not exists longitude numeric;

-- Add latitude and longitude to groups for location-based filtering
alter table public.groups
    add column if not exists latitude numeric;
alter table public.groups
    add column if not exists longitude numeric;

-- Add latitude and longitude to marketplace_items for location-based filtering
alter table public.marketplace_items
    add column if not exists latitude numeric;
alter table public.marketplace_items
    add column if not exists longitude numeric;

-- Create indexes for content rating and location
create index if not exists idx_posts_content_rating on public.posts(content_rating);
create index if not exists idx_media_items_content_rating on public.media_items(content_rating);
create index if not exists idx_events_content_rating on public.events(content_rating);
create index if not exists idx_groups_content_rating on public.groups(content_rating);
create index if not exists idx_profiles_location on public.profiles(latitude, longitude);
create index if not exists idx_events_location on public.events(latitude, longitude);
create index if not exists idx_groups_location on public.groups(latitude, longitude);
create index if not exists idx_marketplace_items_location on public.marketplace_items(latitude, longitude);

-- Create post_likes table for tracking likes
create table if not exists public.post_likes
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
    user_id uuid not null references public.profiles
(
    id
)
  on delete cascade,
    created_at timestamp
  with time zone default now(),
    unique
(
    post_id,
    user_id
)
    );

-- Enable RLS for post_likes
alter table public.post_likes enable row level security;

create
policy "post_likes_select_all"
  on public.post_likes for
select
    using (true);

create
policy "post_likes_insert_own"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

create
policy "post_likes_delete_own"
  on public.post_likes for delete
using (auth.uid() = user_id);

-- Create indexes for post_likes
create index if not exists idx_post_likes_post_id on public.post_likes(post_id);
create index if not exists idx_post_likes_user_id on public.post_likes(user_id);

-- Create media_likes table for tracking media likes
create table if not exists public.media_likes
(
    id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    media_item_id uuid not null references public.media_items
(
    id
) on delete cascade,
    user_id uuid not null references public.profiles
(
    id
)
  on delete cascade,
    created_at timestamp
  with time zone default now(),
    unique
(
    media_item_id,
    user_id
)
    );

-- Enable RLS for media_likes
alter table public.media_likes enable row level security;

create
policy "media_likes_select_all"
  on public.media_likes for
select
    using (true);

create
policy "media_likes_insert_own"
  on public.media_likes for insert
  with check (auth.uid() = user_id);

create
policy "media_likes_delete_own"
  on public.media_likes for delete
using (auth.uid() = user_id);

-- Create indexes for media_likes
create index if not exists idx_media_likes_media_item_id on public.media_likes(media_item_id);
create index if not exists idx_media_likes_user_id on public.media_likes(user_id);

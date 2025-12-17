-- Create media_albums table
create table if not exists public.media_albums
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
    title text not null,
    description text,
    media_type text not null check
(
    media_type
    in
(
    'writing',
    'audio',
    'picture',
    'video'
)),
    created_at timestamp
  with time zone default now(),
    updated_at timestamp
  with time zone default now()
    );

-- Create media_items table
create table if not exists public.media_items
(
    id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    album_id uuid references public.media_albums
(
    id
) on delete cascade,
    user_id uuid not null references public.profiles
(
    id
)
  on delete cascade,
    title text not null,
    description text,
    media_type text not null check
(
    media_type
    in
(
    'writing',
    'audio',
    'picture',
    'video'
)),
    media_url text,
    content text, -- for writings
    thumbnail_url text,
    created_at timestamp
  with time zone default now(),
    updated_at timestamp
  with time zone default now()
    );

-- Create media_tags table
create table if not exists public.media_tags
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
    tag text not null,
    created_at timestamp
  with time zone default now(),
    unique
(
    media_item_id,
    tag
)
    );

-- Enable RLS
alter table public.media_albums enable row level security;
alter table public.media_items enable row level security;
alter table public.media_tags enable row level security;

-- RLS Policies for media_albums
create
policy "albums_select_all"
  on public.media_albums for
select
    using (true);

create
policy "albums_insert_own"
  on public.media_albums for insert
  with check (auth.uid() = user_id);

create
policy "albums_update_own"
  on public.media_albums for
update
    using (auth.uid() = user_id);

create
policy "albums_delete_own"
  on public.media_albums for delete
using (auth.uid() = user_id);

-- RLS Policies for media_items
create
policy "media_select_all"
  on public.media_items for
select
    using (true);

create
policy "media_insert_own"
  on public.media_items for insert
  with check (auth.uid() = user_id);

create
policy "media_update_own"
  on public.media_items for
update
    using (auth.uid() = user_id);

create
policy "media_delete_own"
  on public.media_items for delete
using (auth.uid() = user_id);

-- RLS Policies for media_tags
create
policy "tags_select_all"
  on public.media_tags for
select
    using (true);

create
policy "tags_insert_own"
  on public.media_tags for insert
  with check (
    exists (
      select 1 from public.media_items
      where id = media_item_id and user_id = auth.uid()
    )
  );

create
policy "tags_delete_own"
  on public.media_tags for delete
using (
    exists (
      select 1 from public.media_items
      where id = media_item_id and user_id = auth.uid()
    )
  );

-- Create indexes for better performance
create index if not exists idx_media_albums_user_id on public.media_albums(user_id);
create index if not exists idx_media_items_album_id on public.media_items(album_id);
create index if not exists idx_media_items_user_id on public.media_items(user_id);
create index if not exists idx_media_tags_tag on public.media_tags(tag);
create index if not exists idx_media_tags_media_item_id on public.media_tags(media_item_id);

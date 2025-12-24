-- Velvet Galaxy - Toy Reviews Schema

-- Tags for categorization
create table if not exists public.toy_tags
(
    id
    uuid
    primary
    key
    default
    uuid_generate_v4
(
),
    name text unique not null,
    slug text unique not null,
    created_at timestamptz not null default now
(
)
    );

-- Main Toys table
create table if not exists public.toys
(
    id
    uuid
    primary
    key
    default
    uuid_generate_v4
(
),
    name text not null,
    slug text unique not null,
    brand text,
    description text,
    content text, -- Detailed review content
    rating decimal
(
    3,
    2
) check
(
    rating
    >=
    0
    and
    rating
    <=
    5
),
    price_range text,
    buy_link text,
    is_featured boolean default false,
    created_at timestamptz not null default now
(
),
    updated_at timestamptz not null default now
(
)
    );

-- Toy Media (images, videos, 3D models)
create table if not exists public.toy_media
(
    id
    uuid
    primary
    key
    default
    uuid_generate_v4
(
),
    toy_id uuid not null references public.toys
(
    id
) on delete cascade,
    url text not null,
    type text check
(
    type
    in
(
    'image',
    'video',
    'model_3d'
)) not null,
    is_primary boolean default false,
    created_at timestamptz not null default now
(
)
    );

-- Map toys to tags
create table if not exists public.toy_tag_map
(
    toy_id
    uuid
    references
    public
    .
    toys
(
    id
) on delete cascade,
    tag_id uuid references public.toy_tags
(
    id
)
  on delete cascade,
    primary key
(
    toy_id,
    tag_id
)
    );

-- Comments on toy pages
create table if not exists public.toy_comments
(
    id
    uuid
    primary
    key
    default
    uuid_generate_v4
(
),
    toy_id uuid not null references public.toys
(
    id
) on delete cascade,
    user_id uuid not null references public.profiles
(
    id
)
  on delete cascade,
    content text not null,
    created_at timestamptz not null default now
(
)
    );

-- Likes on toy pages
create table if not exists public.toy_likes
(
    user_id
    uuid
    references
    public
    .
    profiles
(
    id
) on delete cascade,
    toy_id uuid references public.toys
(
    id
)
  on delete cascade,
    created_at timestamptz not null default now
(
),
    primary key
(
    user_id,
    toy_id
)
    );

-- Indexes
create index if not exists idx_toys_slug on public.toys(slug);
create index if not exists idx_toy_media_toy_id on public.toy_media(toy_id);
create index if not exists idx_toy_comments_toy_id on public.toy_comments(toy_id);

-- RLS (Row Level Security) - Simplified for reference
alter table public.toy_tags enable row level security;
alter table public.toys enable row level security;
alter table public.toy_media enable row level security;
alter table public.toy_tag_map enable row level security;
alter table public.toy_comments enable row level security;
alter table public.toy_likes enable row level security;

-- Policies: Anyone can read, only admins (logic handled via application/service role) can write toys/tags/media
create
policy "Public read toys" on public.toys for
select using (true);
create
policy "Public read toy_tags" on public.toy_tags for
select using (true);
create
policy "Public read toy_media" on public.toy_media for
select using (true);
create
policy "Public read toy_tag_map" on public.toy_tag_map for
select using (true);

-- Comments: Anyone can read, authenticated users can insert/delete their own
create
policy "Public read toy_comments" on public.toy_comments for
select using (true);
create
policy "Auth users insert toy_comments" on public.toy_comments for insert with check (auth.uid() = user_id);
create
policy "Users delete own toy_comments" on public.toy_comments for delete
using (auth.uid() = user_id);

-- Likes: Anyone can read, authenticated users can toggle their own
create
policy "Public read toy_likes" on public.toy_likes for
select using (true);
create
policy "Auth users toggle toy_likes" on public.toy_likes for insert with check (auth.uid() = user_id);
create
policy "Users remove own toy_likes" on public.toy_likes for delete
using (auth.uid() = user_id);

-- Migration 052: Create Artists Showcase System
-- This migration adds tables and features for artists to showcase their work
-- including artwork, collections, commissions, and artist profiles

-- ============================================================================
-- ARTIST PROFILES
-- ============================================================================

-- Artist profiles - extended information for users who want to showcase art
create table if not exists public.artist_profiles (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade unique,
    artist_name text, -- Can be different from display name
    bio text,
    specialties text[], -- e.g., ['digital art', 'traditional', 'comics', 'animation']
    commission_status text check (commission_status in ('open', 'closed', 'waitlist')) default 'closed',
    commission_info text, -- Details about commissions, prices, terms
    portfolio_url text,
    social_links jsonb default '{}', -- {twitter: '', instagram: '', artstation: '', etc}
    is_featured boolean default false,
    is_verified boolean default false, -- Verified artist badge
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================================
-- ARTWORK
-- ============================================================================

-- Main artwork table
create table if not exists public.artworks (
    id uuid primary key default uuid_generate_v4(),
    artist_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    description text,
    media_type text check (media_type in ('image', 'animation', 'comic', 'video')) not null,
    media_url text not null, -- Primary artwork file
    thumbnail_url text, -- Optimized thumbnail
    width integer,
    height integer,
    duration integer, -- For animations/videos (in seconds)
    file_size integer, -- In bytes
    tags text[] default '{}', -- e.g., ['nsfw', 'fantasy', 'character design']
    medium text, -- e.g., 'digital', 'watercolor', 'pencil', '3D', 'pixel art'
    software_used text[], -- e.g., ['Photoshop', 'Procreate', 'Blender']
    content_rating text check (content_rating in ('sfw', 'nsfw', 'explicit')) default 'sfw',
    is_mature boolean default false,
    is_commission boolean default false,
    is_featured boolean default false,
    view_count integer default 0,
    visibility text check (visibility in ('public', 'followers', 'private')) default 'public',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================================
-- COLLECTIONS
-- ============================================================================

-- Collections/Series - grouping related artworks
create table if not exists public.art_collections (
    id uuid primary key default uuid_generate_v4(),
    artist_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    description text,
    cover_image_url text,
    is_series boolean default false, -- True for sequential works (comics, story series)
    visibility text check (visibility in ('public', 'followers', 'private')) default 'public',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Mapping artworks to collections
create table if not exists public.art_collection_items (
    collection_id uuid not null references public.art_collections(id) on delete cascade,
    artwork_id uuid not null references public.artworks(id) on delete cascade,
    position integer not null default 0, -- For ordering, especially in series
    primary key (collection_id, artwork_id)
);

-- ============================================================================
-- ENGAGEMENT
-- ============================================================================

-- Artwork likes/appreciation
create table if not exists public.artwork_likes (
    user_id uuid not null references public.profiles(id) on delete cascade,
    artwork_id uuid not null references public.artworks(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, artwork_id)
);

-- Artwork comments
create table if not exists public.artwork_comments (
    id uuid primary key default uuid_generate_v4(),
    artwork_id uuid not null references public.artworks(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    content text not null,
    parent_id uuid references public.artwork_comments(id) on delete cascade, -- For nested replies
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================================
-- COMMISSIONS
-- ============================================================================

-- Commission requests
create table if not exists public.commission_requests (
    id uuid primary key default uuid_generate_v4(),
    artist_id uuid not null references public.profiles(id) on delete cascade,
    client_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    description text not null,
    reference_images text[], -- Array of image URLs
    budget_min decimal(10, 2),
    budget_max decimal(10, 2),
    deadline timestamptz,
    status text check (status in ('pending', 'accepted', 'in_progress', 'completed', 'declined', 'cancelled')) default 'pending',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Artist profiles
create index if not exists idx_artist_profiles_user_id on public.artist_profiles(user_id);
create index if not exists idx_artist_profiles_featured on public.artist_profiles(is_featured) where is_featured = true;
create index if not exists idx_artist_profiles_verified on public.artist_profiles(is_verified) where is_verified = true;

-- Artworks
create index if not exists idx_artworks_artist_id on public.artworks(artist_id);
create index if not exists idx_artworks_created_at on public.artworks(created_at desc);
create index if not exists idx_artworks_view_count on public.artworks(view_count desc);
create index if not exists idx_artworks_tags on public.artworks using gin(tags);
create index if not exists idx_artworks_medium on public.artworks(medium);
create index if not exists idx_artworks_content_rating on public.artworks(content_rating);
create index if not exists idx_artworks_visibility on public.artworks(visibility);
create index if not exists idx_artworks_featured on public.artworks(is_featured) where is_featured = true;

-- Collections
create index if not exists idx_art_collections_artist_id on public.art_collections(artist_id);
create index if not exists idx_art_collection_items_collection_id on public.art_collection_items(collection_id);
create index if not exists idx_art_collection_items_artwork_id on public.art_collection_items(artwork_id);
create index if not exists idx_art_collection_items_position on public.art_collection_items(position);

-- Engagement
create index if not exists idx_artwork_likes_artwork_id on public.artwork_likes(artwork_id);
create index if not exists idx_artwork_likes_user_id on public.artwork_likes(user_id);
create index if not exists idx_artwork_comments_artwork_id on public.artwork_comments(artwork_id);
create index if not exists idx_artwork_comments_user_id on public.artwork_comments(user_id);
create index if not exists idx_artwork_comments_parent_id on public.artwork_comments(parent_id);

-- Commissions
create index if not exists idx_commission_requests_artist_id on public.commission_requests(artist_id);
create index if not exists idx_commission_requests_client_id on public.commission_requests(client_id);
create index if not exists idx_commission_requests_status on public.commission_requests(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table public.artist_profiles enable row level security;
alter table public.artworks enable row level security;
alter table public.art_collections enable row level security;
alter table public.art_collection_items enable row level security;
alter table public.artwork_likes enable row level security;
alter table public.artwork_comments enable row level security;
alter table public.commission_requests enable row level security;

-- Artist Profiles RLS
create policy "Artist profiles are viewable by everyone"
    on public.artist_profiles for select
    using (true);

create policy "Users can create their own artist profile"
    on public.artist_profiles for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own artist profile"
    on public.artist_profiles for update
    using (auth.uid() = user_id);

create policy "Users can delete their own artist profile"
    on public.artist_profiles for delete
    using (auth.uid() = user_id);

-- Artworks RLS
create policy "Public artworks are viewable by everyone"
    on public.artworks for select
    using (
        visibility = 'public' or
        artist_id = auth.uid() or
        (visibility = 'followers' and exists (
            select 1 from public.follows
            where following_id = artist_id and follower_id = auth.uid()
        ))
    );

create policy "Artists can create their own artworks"
    on public.artworks for insert
    with check (auth.uid() = artist_id);

create policy "Artists can update their own artworks"
    on public.artworks for update
    using (auth.uid() = artist_id);

create policy "Artists can delete their own artworks"
    on public.artworks for delete
    using (auth.uid() = artist_id);

-- Art Collections RLS
create policy "Public collections are viewable by everyone"
    on public.art_collections for select
    using (
        visibility = 'public' or
        artist_id = auth.uid() or
        (visibility = 'followers' and exists (
            select 1 from public.follows
            where following_id = artist_id and follower_id = auth.uid()
        ))
    );

create policy "Artists can create their own collections"
    on public.art_collections for insert
    with check (auth.uid() = artist_id);

create policy "Artists can update their own collections"
    on public.art_collections for update
    using (auth.uid() = artist_id);

create policy "Artists can delete their own collections"
    on public.art_collections for delete
    using (auth.uid() = artist_id);

-- Collection Items RLS
create policy "Collection items are viewable with their collection"
    on public.art_collection_items for select
    using (
        exists (
            select 1 from public.art_collections
            where id = collection_id and (
                visibility = 'public' or
                artist_id = auth.uid() or
                (visibility = 'followers' and exists (
                    select 1 from public.follows
                    where following_id = artist_id and follower_id = auth.uid()
                ))
            )
        )
    );

create policy "Artists can add items to their collections"
    on public.art_collection_items for insert
    with check (
        exists (
            select 1 from public.art_collections
            where id = collection_id and artist_id = auth.uid()
        )
    );

create policy "Artists can remove items from their collections"
    on public.art_collection_items for delete
    using (
        exists (
            select 1 from public.art_collections
            where id = collection_id and artist_id = auth.uid()
        )
    );

-- Artwork Likes RLS
create policy "Artwork likes are viewable by everyone"
    on public.artwork_likes for select
    using (true);

create policy "Users can like artworks"
    on public.artwork_likes for insert
    with check (auth.uid() = user_id);

create policy "Users can unlike artworks"
    on public.artwork_likes for delete
    using (auth.uid() = user_id);

-- Artwork Comments RLS
create policy "Artwork comments are viewable by everyone"
    on public.artwork_comments for select
    using (true);

create policy "Authenticated users can create comments"
    on public.artwork_comments for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own comments"
    on public.artwork_comments for update
    using (auth.uid() = user_id);

create policy "Users can delete their own comments"
    on public.artwork_comments for delete
    using (auth.uid() = user_id);

-- Commission Requests RLS
create policy "Commission requests are viewable by artist and client"
    on public.commission_requests for select
    using (auth.uid() = artist_id or auth.uid() = client_id);

create policy "Users can create commission requests"
    on public.commission_requests for insert
    with check (auth.uid() = client_id);

create policy "Clients can update their pending commission requests"
    on public.commission_requests for update
    using (auth.uid() = client_id and status = 'pending');

create policy "Artists can update commission requests they received"
    on public.commission_requests for update
    using (auth.uid() = artist_id);

create policy "Users can delete their commission requests"
    on public.commission_requests for delete
    using (auth.uid() = client_id or auth.uid() = artist_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update artwork view count
create or replace function increment_artwork_views()
returns trigger as $$
begin
    -- This would typically be called from application code
    -- to avoid inflating counts on every query
    return new;
end;
$$ language plpgsql;

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_artist_profiles_updated_at
    before update on public.artist_profiles
    for each row
    execute function update_updated_at_column();

create trigger update_artworks_updated_at
    before update on public.artworks
    for each row
    execute function update_updated_at_column();

create trigger update_art_collections_updated_at
    before update on public.art_collections
    for each row
    execute function update_updated_at_column();

create trigger update_artwork_comments_updated_at
    before update on public.artwork_comments
    for each row
    execute function update_updated_at_column();

create trigger update_commission_requests_updated_at
    before update on public.commission_requests
    for each row
    execute function update_updated_at_column();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for artwork with engagement metrics
create or replace view public.artworks_with_stats
with (security_invoker = true) as
select
    a.*,
    count(distinct al.user_id) as like_count,
    count(distinct ac.id) as comment_count
from public.artworks a
left join public.artwork_likes al on a.id = al.artwork_id
left join public.artwork_comments ac on a.id = ac.artwork_id
group by a.id;

-- View for artist profiles with stats
create or replace view public.artist_profiles_with_stats
with (security_invoker = true) as
select
    ap.*,
    count(distinct aw.id) as artwork_count,
    count(distinct ac.id) as collection_count,
    sum(aw.view_count) as total_views,
    count(distinct f.follower_id) as follower_count
from public.artist_profiles ap
left join public.artworks aw on ap.user_id = aw.artist_id
left join public.art_collections ac on ap.user_id = ac.artist_id
left join public.follows f on ap.user_id = f.following_id
group by ap.id;

-- Grant permissions on views
grant select on public.artworks_with_stats to authenticated;
grant select on public.artist_profiles_with_stats to authenticated;

-- ============================================================================
-- SAMPLE DATA / ENUMS
-- ============================================================================

-- Common art tags for filtering
comment on column public.artworks.tags is
    'Common tags: portrait, landscape, character, creature, environment, concept, fanart, original, sketch, lineart, colored, shaded, nsfw, sfw, commission, personal';

comment on column public.artist_profiles.specialties is
    'Common specialties: digital painting, traditional art, character design, concept art, comics, manga, animation, 3D modeling, pixel art, vector art, illustration';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Record migration
insert into public.migrations (name, executed_at)
values ('052_create_artists_showcase', now())
on conflict (name) do nothing;

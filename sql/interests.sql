-- Velvet Galaxy - Interest Tags & User Preferences

-- Global interest tags
create table if not exists public.interest_tags
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
    category text, -- e.g., 'lifestyle', 'community', 'kink'
    created_at timestamptz not null default now
(
)
    );

-- User interests (many-to-many)
create table if not exists public.user_interests
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
    tag_id uuid not null references public.interest_tags
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
    tag_id
)
    );

-- RLS
alter table public.interest_tags enable row level security;
alter table public.user_interests enable row level security;

create
policy "Anyone can read interest tags" on public.interest_tags for
select using (true);
create
policy "Users can read own interests" on public.user_interests for
select using (auth.uid() = user_id);
create
policy "Users can manage own interests" on public.user_interests for all using (auth.uid() = user_id);

-- Initial tags
insert into public.interest_tags (name, slug, category)
values ('BDSM', 'bdsm', 'kink'),
       ('Polyamory', 'polyamory', 'lifestyle'),
       ('Fetish', 'fetish', 'kink'),
       ('LGBTQ+', 'lgbtq', 'community'),
       ('Events', 'events', 'community'),
       ('Photography', 'photography', 'lifestyle'),
       ('Art', 'art', 'lifestyle'),
       ('Music', 'music', 'lifestyle'),
       ('Tech', 'tech', 'lifestyle'),
       ('Gaming', 'gaming', 'lifestyle') on conflict (slug) do nothing;

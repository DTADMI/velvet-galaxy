-- Velvet Galaxy - Co-authorship Schema

-- Table to track co-authors for posts
create table if not exists public.post_authors
(
    post_id
    uuid
    references
    public
    .
    posts
(
    id
) on delete cascade,
    user_id uuid references public.profiles
(
    id
)
  on delete cascade,
    status text check
(
    status
    in
(
    'pending',
    'accepted',
    'declined'
)) default 'pending',
    created_at timestamptz not null default now
(
),
    primary key
(
    post_id,
    user_id
)
    );

-- RLS
alter table public.post_authors enable row level security;

create
policy "Public read post_authors" on public.post_authors for
select using (true);

create
policy "Authors can manage co-authors" on public.post_authors
    using (
        exists (
            select 1 from public.posts
            where id = post_id and author_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.posts
            where id = post_id and author_id = auth.uid()
        )
    );

create
policy "Users can accept co-authorship" on public.post_authors
    for
update
    using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Index
create index if not exists idx_post_authors_post_id on public.post_authors(post_id);
create index if not exists idx_post_authors_user_id on public.post_authors(user_id);

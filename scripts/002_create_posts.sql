-- Create posts table
create table if not exists public.posts
(
    id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    author_id uuid not null references public.profiles
(
    id
) on delete cascade,
    content text not null,
    image_url text,
    created_at timestamp
  with time zone default now(),
    updated_at timestamp
  with time zone default now()
    );

-- Enable RLS
alter table public.posts enable row level security;

-- RLS Policies for posts
create
policy "posts_select_all"
  on public.posts for
select
    using (true);

create
policy "posts_insert_own"
  on public.posts for insert
  with check (auth.uid() = author_id);

create
policy "posts_update_own"
  on public.posts for
update
    using (auth.uid() = author_id);

create
policy "posts_delete_own"
  on public.posts for delete
using (auth.uid() = author_id);

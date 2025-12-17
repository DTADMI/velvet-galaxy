-- Create marketplace_items table
create table if not exists public.marketplace_items
(
    id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    seller_id uuid not null references public.profiles
(
    id
) on delete cascade,
    title text not null,
    description text not null,
    price decimal
(
    10,
    2
) not null,
    location text not null,
    image_url text,
    status text not null default 'available' check
(
    status
    in
(
    'available',
    'sold',
    'pending'
)),
    created_at timestamp
  with time zone default now(),
    updated_at timestamp
  with time zone default now()
    );

-- Enable RLS
alter table public.marketplace_items enable row level security;

-- RLS Policies for marketplace_items
create
policy "marketplace_select_all"
  on public.marketplace_items for
select
    using (true);

create
policy "marketplace_insert_own"
  on public.marketplace_items for insert
  with check (auth.uid() = seller_id);

create
policy "marketplace_update_own"
  on public.marketplace_items for
update
    using (auth.uid() = seller_id);

create
policy "marketplace_delete_own"
  on public.marketplace_items for delete
using (auth.uid() = seller_id);

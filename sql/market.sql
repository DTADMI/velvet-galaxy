-- Velvet Galaxy - Market Schema

-- Product Categories
create table if not exists public.market_categories
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
    description text,
    created_at timestamptz not null default now
(
)
    );

-- Products
create table if not exists public.products
(
    id
    uuid
    primary
    key
    default
    uuid_generate_v4
(
),
    category_id uuid references public.market_categories
(
    id
) on delete set null,
    name text not null,
    slug text unique not null,
    description text,
    price decimal
(
    10,
    2
) not null,
    currency text default 'USD',
    stock_quantity integer default 0,
    is_digital boolean default false,
    media_url text, -- Primary image
    stripe_product_id text,
    stripe_price_id text,
    metadata jsonb default '{}'::jsonb,
    is_active boolean default true,
    created_at timestamptz not null default now
(
),
    updated_at timestamptz not null default now
(
)
    );

-- Product Media
create table if not exists public.product_media
(
    id
    uuid
    primary
    key
    default
    uuid_generate_v4
(
),
    product_id uuid not null references public.products
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
    'video'
)) not null,
    is_primary boolean default false,
    created_at timestamptz not null default now
(
)
    );

-- Orders
create table if not exists public.orders
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
    status text not null default 'pending', -- pending, paid, shipped, delivered, cancelled
    total_amount decimal
(
    10,
    2
) not null,
    currency text default 'USD',
    stripe_checkout_id text,
    shipping_address jsonb,
    created_at timestamptz not null default now
(
),
    updated_at timestamptz not null default now
(
)
    );

-- Order Items
create table if not exists public.order_items
(
    id
    uuid
    primary
    key
    default
    uuid_generate_v4
(
),
    order_id uuid not null references public.orders
(
    id
) on delete cascade,
    product_id uuid references public.products
(
    id
)
  on delete set null,
    quantity integer not null default 1,
    unit_price decimal
(
    10,
    2
) not null,
    created_at timestamptz not null default now
(
)
    );

-- RLS
alter table public.market_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_media enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Policies
create
policy "Public read categories" on public.market_categories for
select using (true);
create
policy "Public read products" on public.products for
select using (is_active = true);
create
policy "Public read product_media" on public.product_media for
select using (true);

create
policy "Users can view own orders" on public.orders for
select using (auth.uid() = user_id);
create
policy "Users can view own order items" on public.order_items for
select using (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
    );

-- Indexes
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_order_items_order on public.order_items(order_id);

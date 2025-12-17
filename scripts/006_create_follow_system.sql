-- Create follows table
create table if not exists public.follows
(
    id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    follower_id uuid not null references public.profiles
(
    id
) on delete cascade,
    following_id uuid not null references public.profiles
(
    id
)
  on delete cascade,
    created_at timestamp
  with time zone default now(),
    unique
(
    follower_id,
    following_id
),
    check
(
    follower_id
    !=
    following_id
)
    );

-- Create notifications table
create table if not exists public.notifications
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
    type text not null check
(
    type
    in
(
    'follow',
    'group_invite',
    'event_invite',
    'friend_request',
    'message',
    'like',
    'comment'
)),
    title text not null,
    message text not null,
    link text,
    read boolean default false,
    from_user_id uuid references public.profiles
(
    id
)
  on delete cascade,
    created_at timestamp
  with time zone default now()
    );

-- Enable RLS
alter table public.follows enable row level security;
alter table public.notifications enable row level security;

-- RLS Policies for follows
create
policy "follows_select_all"
  on public.follows for
select
    using (true);

create
policy "follows_insert_own"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create
policy "follows_delete_own"
  on public.follows for delete
using (auth.uid() = follower_id);

-- RLS Policies for notifications
create
policy "notifications_select_own"
  on public.notifications for
select
    using (auth.uid() = user_id);

create
policy "notifications_update_own"
  on public.notifications for
update
    using (auth.uid() = user_id);

create
policy "notifications_delete_own"
  on public.notifications for delete
using (auth.uid() = user_id);

-- Create indexes
create index if not exists idx_follows_follower_id on public.follows(follower_id);
create index if not exists idx_follows_following_id on public.follows(following_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(read);

-- Function to create notification on follow
create
or replace function public.create_follow_notification()
returns trigger
language plpgsql
security definer
as $$
declare
follower_name text;
begin
select display_name
into follower_name
from public.profiles
where id = new.follower_id;

insert into public.notifications (user_id, type, title, message, from_user_id, link)
values (new.following_id,
        'follow',
        'New Follower',
        follower_name || ' started following you',
        new.follower_id,
        '/profile/' || new.follower_id);

return new;
end;
$$;

drop trigger if exists on_follow_created on public.follows;

create trigger on_follow_created
    after insert
    on public.follows
    for each row
    execute function public.create_follow_notification();

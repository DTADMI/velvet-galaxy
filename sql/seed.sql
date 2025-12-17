-- Velvet Galaxy - Seed data for local development
-- This seeds a few users, relationships, posts, and notifications for quick testing.

-- Profiles
insert into public.profiles (id, username, display_name, avatar_url, bio)
values (uuid_generate_v4(), 'alice', 'Alice', null, 'Hi, I am Alice!'),
       (uuid_generate_v4(), 'bob', 'Bob', null, 'Bob here.'),
       (uuid_generate_v4(), 'carol', 'Carol', null, 'Loves stargazing.');

-- For predictable relations, fetch ids (for SQL editor usage):
-- select id, username from public.profiles where username in ('alice','bob','carol');

-- The following block assumes you copy the IDs from the query above
-- and run the inserts with actual UUIDs. Example template:
-- insert into public.follows (follower_id, following_id) values ('<alice_id>', '<bob_id>');
-- insert into public.friendships (user_id, friend_id, status) values ('<alice_id>', '<carol_id>', 'accepted');

-- Example posts (replace <alice_id>/<bob_id> with actual UUIDs)
-- insert into public.posts (author_id, content) values ('<alice_id>', 'Hello Velvet Galaxy!');
-- insert into public.posts (author_id, content) values ('<bob_id>', 'Beautiful night sky today.');

-- Example activities (replace <alice_id>/<bob_id>/<post_id>)
-- insert into public.activities (user_id, activity_type, target_id, target_type, content)
-- values ('<alice_id>', 'post', '<post_id>', 'post', 'Alice posted something');

-- Example notifications (replace <alice_id>/<bob_id>)
-- insert into public.notifications (user_id, from_user_id, type, title, message, link)
-- values ('<alice_id>', '<bob_id>', 'follow', 'New follower', 'Bob started following you', '/profile/<bob_id>');

-- Example groups/events
-- insert into public.groups (creator_id, name, description) values ('<alice_id>', 'Stargazers', 'A group for night sky lovers');
-- insert into public.events (creator_id, title, description, starts_at, location)
-- values ('<alice_id>', 'Meteor Shower Watch', 'Let\'s watch together', now() + interval '3 days', 'Local Park');

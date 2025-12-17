-- Add privacy and comment settings to profiles
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public';
-- Options: 'public', 'followers', 'friends', 'private'

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT true;
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS show_activity_status BOOLEAN DEFAULT true;
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS allow_comments_on_posts BOOLEAN DEFAULT true;
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS who_can_comment TEXT DEFAULT 'everyone';
-- Options: 'everyone', 'followers', 'friends', 'nobody'

-- Add comment settings to posts
ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN DEFAULT true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_profile_visibility ON profiles(profile_visibility);
CREATE INDEX IF NOT EXISTS idx_posts_comments_enabled ON posts(comments_enabled);

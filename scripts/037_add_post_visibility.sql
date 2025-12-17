-- Add visibility field to posts table
ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'everyone';

-- Add comment to explain the field
COMMENT
ON COLUMN posts.visibility IS 'Post visibility: everyone or friends_only';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);

-- Update RLS policies to respect visibility
DROP
POLICY IF EXISTS "posts_select_all" ON posts;

CREATE
POLICY "posts_select_public"
  ON posts FOR
SELECT
    USING (
    visibility = 'everyone'
    OR author_id = auth.uid()
    OR (
    visibility = 'friends_only'
    AND EXISTS (
    SELECT 1 FROM friendships
    WHERE (
    (user_id = auth.uid() AND friend_id = posts.author_id)
    OR (user_id = posts.author_id AND friend_id = auth.uid())
    )
    AND status = 'accepted'
    )
    )
    );

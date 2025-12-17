-- Drop the old comments table and recreate with post_id
-- This is a migration from the generic content_type/content_id pattern to specific post_id

-- First, backup any existing comments (optional, but good practice)
-- If you have important data, export it first before running this

-- Drop dependent tables first
DROP TABLE IF EXISTS comment_likes CASCADE;

-- Drop the old comments table
DROP TABLE IF EXISTS comments CASCADE;

-- Create new comments table with post_id
CREATE TABLE comments
(
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id           UUID NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    content           TEXT NOT NULL,
    parent_comment_id UUID REFERENCES comments (id) ON DELETE CASCADE,
    created_at        TIMESTAMPTZ      DEFAULT NOW(),
    updated_at        TIMESTAMPTZ      DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_comments_post_id ON comments (post_id);
CREATE INDEX idx_comments_user_id ON comments (user_id);
CREATE INDEX idx_comments_parent_id ON comments (parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments (created_at DESC);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE
POLICY "Comments are viewable by everyone"
  ON comments FOR
SELECT
    USING (true);

CREATE
POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE
POLICY "Users can update their own comments"
  ON comments FOR
UPDATE
    USING (auth.uid() = user_id);

CREATE
POLICY "Users can delete their own comments"
  ON comments FOR DELETE
USING (auth.uid() = user_id);

-- Create comment_likes table
CREATE TABLE comment_likes
(
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments (id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ      DEFAULT NOW(),
    UNIQUE (comment_id, user_id)
);

-- Create indexes
CREATE INDEX idx_comment_likes_comment_id ON comment_likes (comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes (user_id);

-- Enable RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_likes
CREATE
POLICY "Comment likes are viewable by everyone"
  ON comment_likes FOR
SELECT
    USING (true);

CREATE
POLICY "Users can like comments"
  ON comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE
POLICY "Users can unlike comments"
  ON comment_likes FOR DELETE
USING (auth.uid() = user_id);

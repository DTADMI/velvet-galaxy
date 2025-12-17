-- Add comments system with nested replies
CREATE TABLE IF NOT EXISTS comments
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    user_id UUID REFERENCES auth.users
(
    id
) ON DELETE CASCADE NOT NULL,
    content_type TEXT NOT NULL CHECK
(
    content_type
    IN
(
    'post',
    'media'
)),
    content_id UUID NOT NULL,
    parent_comment_id UUID REFERENCES comments
(
    id
)
  ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ DEFAULT NOW
(
)
    );

-- Add likes for comments
CREATE TABLE IF NOT EXISTS comment_likes
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    user_id UUID REFERENCES auth.users
(
    id
) ON DELETE CASCADE NOT NULL,
    comment_id UUID REFERENCES comments
(
    id
)
  ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW
(
),
    UNIQUE
(
    user_id,
    comment_id
)
    );

-- Add bookmarks
CREATE TABLE IF NOT EXISTS bookmarks
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    user_id UUID REFERENCES auth.users
(
    id
) ON DELETE CASCADE NOT NULL,
    content_type TEXT NOT NULL CHECK
(
    content_type
    IN
(
    'post',
    'media',
    'event',
    'group'
)),
    content_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW
(
),
    UNIQUE
(
    user_id,
    content_type,
    content_id
)
    );

-- Add shares tracking
CREATE TABLE IF NOT EXISTS shares
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    user_id UUID REFERENCES auth.users
(
    id
) ON DELETE CASCADE NOT NULL,
    content_type TEXT NOT NULL CHECK
(
    content_type
    IN
(
    'post',
    'media',
    'event',
    'group'
)),
    content_id UUID NOT NULL,
    recipient_user_id UUID REFERENCES auth.users
(
    id
)
  ON DELETE CASCADE NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW
(
)
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_comments_content ON comments(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_recipient ON shares(recipient_user_id);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE
POLICY "Anyone can view comments" ON comments FOR
SELECT USING (true);
CREATE
POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE
POLICY "Users can update own comments" ON comments FOR
UPDATE USING (auth.uid() = user_id);
CREATE
POLICY "Users can delete own comments" ON comments FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for comment_likes
CREATE
POLICY "Anyone can view comment likes" ON comment_likes FOR
SELECT USING (true);
CREATE
POLICY "Users can like comments" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE
POLICY "Users can unlike comments" ON comment_likes FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for bookmarks
CREATE
POLICY "Users can view own bookmarks" ON bookmarks FOR
SELECT USING (auth.uid() = user_id);
CREATE
POLICY "Users can create bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE
POLICY "Users can delete own bookmarks" ON bookmarks FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for shares
CREATE
POLICY "Users can view shares sent to them" ON shares FOR
SELECT USING (auth.uid() = recipient_user_id OR auth.uid() = user_id);
CREATE
POLICY "Users can create shares" ON shares FOR INSERT WITH CHECK (auth.uid() = user_id);

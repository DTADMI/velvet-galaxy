-- Add promotional content flag and content type to posts
ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS is_promotional BOOLEAN DEFAULT FALSE;
ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'video', 'audio', 'writing'));

-- Add account type to profiles
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'personal' CHECK (account_type IN ('personal', 'organization'));
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE;

-- Create post_likes_count materialized view for performance
CREATE
MATERIALIZED VIEW IF NOT EXISTS post_popularity AS
SELECT p.id                                                                                      as post_id,
       COUNT(DISTINCT pl.user_id)                                                                as like_count,
       COUNT(DISTINCT c.id)                                                                      as comment_count,
       COUNT(DISTINCT b.user_id)                                                                 as bookmark_count,
       (COUNT(DISTINCT pl.user_id) * 2 + COUNT(DISTINCT c.id) + COUNT(DISTINCT b.user_id) * 1.5) as popularity_score,
       p.created_at
FROM posts p
         LEFT JOIN post_likes pl ON p.id = pl.post_id
         LEFT JOIN comments c ON p.id = c.post_id
         LEFT JOIN bookmarks b ON p.id = b.post_id
GROUP BY p.id, p.created_at;

CREATE INDEX IF NOT EXISTS idx_post_popularity_score ON post_popularity(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_post_popularity_created ON post_popularity(created_at DESC);

-- Refresh function for materialized view
CREATE
OR REPLACE FUNCTION refresh_post_popularity()
RETURNS void AS $$
BEGIN
  REFRESH
MATERIALIZED VIEW CONCURRENTLY post_popularity;
END;
$$
LANGUAGE plpgsql;

-- Create verification requests table
CREATE TABLE IF NOT EXISTS verification_requests
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    user_id UUID NOT NULL REFERENCES profiles
(
    id
) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK
(
    status
    IN
(
    'pending',
    'approved',
    'rejected'
)),
    verification_image_url TEXT,
    submitted_at TIMESTAMP
  WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP
  WITH TIME ZONE,
      reviewed_by UUID REFERENCES profiles(id),
    notes TEXT
    );

CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);

-- Enable RLS
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

CREATE
POLICY "verification_requests_select_own"
  ON verification_requests FOR
SELECT
    USING (auth.uid() = user_id);

CREATE
POLICY "verification_requests_insert_own"
  ON verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create anonymous FAQ table
CREATE TABLE IF NOT EXISTS anonymous_questions
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    recipient_id UUID NOT NULL REFERENCES profiles
(
    id
) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
  WITH TIME ZONE DEFAULT NOW(),
    answered_at TIMESTAMP
  WITH TIME ZONE
      );

CREATE INDEX IF NOT EXISTS idx_anonymous_questions_recipient ON anonymous_questions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_questions_public ON anonymous_questions(is_public) WHERE is_public = TRUE;

-- Enable RLS
ALTER TABLE anonymous_questions ENABLE ROW LEVEL SECURITY;

CREATE
POLICY "anonymous_questions_select_public"
  ON anonymous_questions FOR
SELECT
    USING (is_public = TRUE OR auth.uid() = recipient_id);

CREATE
POLICY "anonymous_questions_insert_all"
  ON anonymous_questions FOR INSERT
  WITH CHECK (TRUE);

CREATE
POLICY "anonymous_questions_update_own"
  ON anonymous_questions FOR
UPDATE
    USING (auth.uid() = recipient_id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_promotional ON posts(is_promotional);
CREATE INDEX IF NOT EXISTS idx_posts_content_type ON posts(content_type);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);

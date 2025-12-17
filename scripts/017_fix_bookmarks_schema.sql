-- Drop old bookmarks table and recreate with post_id instead of content_type/content_id
DROP TABLE IF EXISTS public.bookmarks CASCADE;

CREATE TABLE IF NOT EXISTS public.bookmarks
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
    post_id UUID REFERENCES public.posts
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
    post_id
)
    );

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post ON public.bookmarks(post_id);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE
POLICY "Users can view own bookmarks" ON public.bookmarks FOR
SELECT USING (auth.uid() = user_id);
CREATE
POLICY "Users can create bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE
POLICY "Users can delete own bookmarks" ON public.bookmarks FOR DELETE
USING (auth.uid() = user_id);

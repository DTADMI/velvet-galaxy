-- Add poll support to posts table
ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS poll_question text,
    ADD COLUMN IF NOT EXISTS poll_options jsonb,
    ADD COLUMN IF NOT EXISTS poll_multiple_choice boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS poll_end_date timestamp with time zone;

-- Create poll_votes table
CREATE TABLE IF NOT EXISTS public.poll_votes
(
    id
    uuid
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    post_id uuid NOT NULL REFERENCES public.posts
(
    id
) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles
(
    id
)
  ON DELETE CASCADE,
    option_index integer NOT NULL,
    created_at timestamp
  with time zone DEFAULT now(),
    UNIQUE
(
    post_id,
    user_id,
    option_index
)
    );

-- Enable RLS
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for poll_votes
CREATE
POLICY "poll_votes_select_all"
  ON public.poll_votes FOR
SELECT
    USING (true);

CREATE
POLICY "poll_votes_insert_own"
  ON public.poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE
POLICY "poll_votes_delete_own"
  ON public.poll_votes FOR DELETE
USING (auth.uid() = user_id);

-- Create anonymous_questions table
CREATE TABLE IF NOT EXISTS public.anonymous_questions
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    recipient_id UUID NOT NULL REFERENCES public.profiles
(
    id
) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    answered_at TIMESTAMPTZ,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now
(
),
    updated_at TIMESTAMPTZ DEFAULT now
(
)
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_anonymous_questions_recipient ON public.anonymous_questions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_questions_public ON public.anonymous_questions(is_public);
CREATE INDEX IF NOT EXISTS idx_anonymous_questions_answered ON public.anonymous_questions(answered_at);

-- Enable RLS
ALTER TABLE public.anonymous_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can submit anonymous questions
CREATE
POLICY "Anyone can submit anonymous questions"
  ON public.anonymous_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Recipients can view all their questions
CREATE
POLICY "Recipients can view their questions"
  ON public.anonymous_questions
  FOR
SELECT
    TO authenticated
    USING (recipient_id = auth.uid());

-- Anyone can view public answered questions
CREATE
POLICY "Anyone can view public questions"
  ON public.anonymous_questions
  FOR
SELECT
    TO authenticated
    USING (is_public = true AND answer IS NOT NULL);

-- Recipients can update their questions (answer them)
CREATE
POLICY "Recipients can answer questions"
  ON public.anonymous_questions
  FOR
UPDATE
    TO authenticated
    USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- Recipients can delete their questions
CREATE
POLICY "Recipients can delete questions"
  ON public.anonymous_questions
  FOR DELETE
TO authenticated
  USING (recipient_id = auth.uid());

-- Create updated_at trigger
CREATE
OR REPLACE FUNCTION update_anonymous_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at
= now();
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER update_anonymous_questions_updated_at
    BEFORE UPDATE
    ON public.anonymous_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_anonymous_questions_updated_at();

-- Create reports table for content moderation
CREATE TABLE IF NOT EXISTS public.reports
(
    id
    uuid
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    reporter_id uuid NOT NULL REFERENCES public.profiles
(
    id
) ON DELETE CASCADE,
    content_type text NOT NULL CHECK
(
    content_type
    IN
(
    'post',
    'message',
    'room',
    'group',
    'event',
    'user',
    'comment'
)),
    content_id uuid NOT NULL,
    reason text NOT NULL CHECK
(
    reason
    IN
(
    'harassment',
    'hate_speech',
    'spam',
    'inappropriate_content',
    'copyright',
    'impersonation',
    'underage',
    'violence',
    'other'
)),
    description text,
    status text NOT NULL DEFAULT 'pending' CHECK
(
    status
    IN
(
    'pending',
    'reviewing',
    'resolved',
    'dismissed'
)),
    reviewed_by uuid REFERENCES public.profiles
(
    id
),
    reviewed_at timestamp with time zone,
    resolution_notes text,
    created_at timestamp
  with time zone DEFAULT now(),
    updated_at timestamp
  with time zone DEFAULT now()
    );

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
CREATE
POLICY "reports_insert_authenticated"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE
POLICY "reports_select_own"
  ON public.reports FOR
SELECT
    USING (auth.uid() = reporter_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS reports_content_type_id_idx ON public.reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);
CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON public.reports(reporter_id);

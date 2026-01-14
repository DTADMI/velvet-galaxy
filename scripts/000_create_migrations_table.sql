-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS public.schema_migrations
(
    id
    SERIAL
    PRIMARY
    KEY,
    version
    TEXT
    UNIQUE
    NOT
    NULL,
    name
    TEXT
    NOT
    NULL,
    executed_at
    TIMESTAMPTZ
    DEFAULT
    now
(
) NOT NULL,
    checksum TEXT
    );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON public.schema_migrations(version);

-- Enable RLS but allow everyone to read (for debugging)
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;

CREATE
POLICY "Anyone can read migrations"
    ON public.schema_migrations
    FOR
SELECT
    USING (true);

-- Only service role can insert/update/delete
-- This will be handled by the migration runner with elevated permissions

COMMENT
ON TABLE public.schema_migrations IS 'Tracks which database migrations have been executed';
COMMENT
ON COLUMN public.schema_migrations.version IS 'Migration version number (e.g., 001, 002, 040)';
COMMENT
ON COLUMN public.schema_migrations.name IS 'Human-readable migration name';
COMMENT
ON COLUMN public.schema_migrations.checksum IS 'MD5 checksum of the migration file to detect changes';

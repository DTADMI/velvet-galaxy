-- Create custom_relationship_types table
CREATE TABLE IF NOT EXISTS public.custom_relationship_types
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    user_id UUID NOT NULL REFERENCES public.profiles
(
    id
) ON DELETE CASCADE,
    label TEXT NOT NULL,
    description TEXT,
    node_color TEXT DEFAULT '#8b5cf6',
    edge_color TEXT DEFAULT '#a855f7',
    created_at TIMESTAMPTZ DEFAULT now
(
) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now
(
) NOT NULL,
    CONSTRAINT unique_user_label UNIQUE
(
    user_id,
    label
)
    );

-- Create user_relationships table (enhanced version)
CREATE TABLE IF NOT EXISTS public.user_relationships
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    initiator_id UUID NOT NULL REFERENCES public.profiles
(
    id
) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles
(
    id
)
  ON DELETE CASCADE,
    relationship_type_id UUID REFERENCES public.custom_relationship_types
(
    id
)
  ON DELETE CASCADE,
    default_type TEXT,
    status TEXT DEFAULT 'pending' NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now
(
) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now
(
) NOT NULL,
    accepted_at TIMESTAMPTZ,
    CONSTRAINT valid_status CHECK
(
    status
    IN
(
    'pending',
    'accepted',
    'declined',
    'blocked'
)),
    CONSTRAINT valid_default_type CHECK
(
    default_type
    IS
    NULL
    OR
    default_type
    IN
(
    'friend',
    'partner',
    'family',
    'colleague',
    'acquaintance',
    'other'
)
    ),
    CONSTRAINT different_users CHECK
(
    initiator_id
    !=
    recipient_id
),
    CONSTRAINT relationship_type_specified CHECK
(
    relationship_type_id
    IS
    NOT
    NULL
    OR
    default_type
    IS
    NOT
    NULL
)
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_relationship_types_user_id ON public.custom_relationship_types(user_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_initiator ON public.user_relationships(initiator_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_recipient ON public.user_relationships(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_status ON public.user_relationships(status);
CREATE INDEX IF NOT EXISTS idx_user_relationships_type ON public.user_relationships(relationship_type_id);

-- Enable RLS
ALTER TABLE public.custom_relationship_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_relationship_types
CREATE
POLICY "Users can view their own relationship types"
    ON public.custom_relationship_types
    FOR
SELECT
    USING (auth.uid() = user_id);

CREATE
POLICY "Users can view others' relationship types in their connections"
    ON public.custom_relationship_types
    FOR
SELECT
    USING (
    EXISTS (
    SELECT 1 FROM public.user_relationships
    WHERE (initiator_id = auth.uid() OR recipient_id = auth.uid())
    AND relationship_type_id = custom_relationship_types.id
    AND status = 'accepted'
    )
    );

CREATE
POLICY "Users can create their own relationship types"
    ON public.custom_relationship_types
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE
POLICY "Users can update their own relationship types"
    ON public.custom_relationship_types
    FOR
UPDATE
    USING (auth.uid() = user_id);

CREATE
POLICY "Users can delete their own relationship types"
    ON public.custom_relationship_types
    FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for user_relationships
CREATE
POLICY "Users can view relationships they're part of"
    ON public.user_relationships
    FOR
SELECT
    USING (
    auth.uid() = initiator_id OR
    auth.uid() = recipient_id
    );

CREATE
POLICY "Users can create relationship requests"
    ON public.user_relationships
    FOR INSERT
    WITH CHECK (auth.uid() = initiator_id);

CREATE
POLICY "Users can update relationships they're part of"
    ON public.user_relationships
    FOR
UPDATE
    USING (
    auth.uid() = initiator_id OR
    auth.uid() = recipient_id
    );

CREATE
POLICY "Users can delete relationships they initiated"
    ON public.user_relationships
    FOR DELETE
USING (auth.uid() = initiator_id);

-- Create triggers for updated_at
CREATE
OR REPLACE FUNCTION public.update_custom_relationship_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at
= now();
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER update_custom_relationship_types_updated_at
    BEFORE UPDATE
    ON public.custom_relationship_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_custom_relationship_types_updated_at();

CREATE
OR REPLACE FUNCTION public.update_user_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at
= now();
    IF
NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        NEW.accepted_at = now();
END IF;
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER update_user_relationships_updated_at
    BEFORE UPDATE
    ON public.user_relationships
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_relationships_updated_at();

-- Insert default relationship type templates (optional - users can customize)
INSERT INTO public.custom_relationship_types (user_id, label, description, node_color, edge_color)
SELECT id,
       'Close Friend',
       'A close personal friend',
       '#8b5cf6',
       '#a855f7'
FROM public.profiles
WHERE NOT EXISTS (SELECT 1
                  FROM public.custom_relationship_types
                  WHERE custom_relationship_types.user_id = profiles.id) ON CONFLICT (user_id, label) DO NOTHING;

COMMENT
ON TABLE public.custom_relationship_types IS 'User-defined custom relationship type labels with colors';
COMMENT
ON TABLE public.user_relationships IS 'Relationships between users with custom or default types';
COMMENT
ON COLUMN public.user_relationships.status IS 'pending, accepted, declined, or blocked';
COMMENT
ON COLUMN public.user_relationships.relationship_type_id IS 'Reference to custom relationship type';
COMMENT
ON COLUMN public.user_relationships.default_type IS 'Fallback to standard relationship types';

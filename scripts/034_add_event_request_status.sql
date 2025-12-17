-- Add request status for private events
ALTER TABLE event_responses
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

-- Add privacy setting to events
ALTER TABLE events
    ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Update RLS policies for event responses
DROP
POLICY IF EXISTS "event_responses_select" ON event_responses;
CREATE
POLICY "event_responses_select" ON event_responses
  FOR
SELECT USING (true);

DROP
POLICY IF EXISTS "event_responses_insert" ON event_responses;
CREATE
POLICY "event_responses_insert" ON event_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP
POLICY IF EXISTS "event_responses_update" ON event_responses;
CREATE
POLICY "event_responses_update" ON event_responses
  FOR
UPDATE USING (
    auth.uid() = user_id OR
    auth.uid() IN (
    SELECT creator_id FROM events WHERE id = event_responses.event_id
    )
    );

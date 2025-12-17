-- Fix comment activity trigger to use user_id instead of author_id
-- The comments table uses user_id, not author_id

CREATE
OR REPLACE FUNCTION track_comment_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF
(TG_OP = 'INSERT') THEN
    INSERT INTO activities (user_id, activity_type, target_id, target_type, metadata)
    VALUES (NEW.user_id, 'comment', NEW.post_id, 'post', jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id));
END IF;
RETURN NEW;
END;
$$;

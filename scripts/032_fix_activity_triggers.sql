-- Fix activity tracking triggers to use correct column names

-- Fix post creation activity trigger to use author_id instead of user_id
CREATE
OR REPLACE FUNCTION track_post_creation_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF
(TG_OP = 'INSERT') THEN
    INSERT INTO activities (user_id, activity_type, target_id, target_type, metadata)
    VALUES (NEW.author_id, 'post', NEW.id, 'post', jsonb_build_object('post_id', NEW.id, 'content_rating', NEW.content_rating));
END IF;
RETURN NEW;
END;
$$;

-- Fix comment activity trigger to use author_id instead of user_id
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
    VALUES (NEW.author_id, 'comment', NEW.post_id, 'post', jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id));
END IF;
RETURN NEW;
END;
$$;

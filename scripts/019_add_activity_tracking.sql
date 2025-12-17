-- Add activity tracking for user actions

-- Function to create activity
CREATE
OR REPLACE FUNCTION create_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_target_id TEXT DEFAULT NULL,
  p_target_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
INSERT INTO activities (user_id, activity_type, target_id, target_type, metadata)
VALUES (p_user_id, p_activity_type, p_target_id, p_target_type, p_metadata);
END;
$$;

-- Trigger function for post likes
CREATE
OR REPLACE FUNCTION track_post_like_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF
(TG_OP = 'INSERT') THEN
    INSERT INTO activities (user_id, activity_type, target_id, target_type, metadata)
    VALUES (NEW.user_id, 'like', NEW.post_id, 'post', jsonb_build_object('post_id', NEW.post_id));
END IF;
RETURN NEW;
END;
$$;

-- Trigger for post likes
DROP TRIGGER IF EXISTS post_like_activity_trigger ON post_likes;
CREATE TRIGGER post_like_activity_trigger
    AFTER INSERT
    ON post_likes
    FOR EACH ROW
    EXECUTE FUNCTION track_post_like_activity();

-- Trigger function for event responses
CREATE
OR REPLACE FUNCTION track_event_response_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF
(TG_OP = 'INSERT' AND NEW.response IN ('going', 'interested')) THEN
    INSERT INTO activities (user_id, activity_type, target_id, target_type, metadata)
    VALUES (NEW.user_id, 'event_join', NEW.event_id, 'event', jsonb_build_object('event_id', NEW.event_id, 'response', NEW.response));
END IF;
RETURN NEW;
END;
$$;

-- Trigger for event responses
DROP TRIGGER IF EXISTS event_response_activity_trigger ON event_responses;
CREATE TRIGGER event_response_activity_trigger
    AFTER INSERT
    ON event_responses
    FOR EACH ROW
    EXECUTE FUNCTION track_event_response_activity();

-- Trigger function for group joins
CREATE
OR REPLACE FUNCTION track_group_join_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF
(TG_OP = 'INSERT') THEN
    INSERT INTO activities (user_id, activity_type, target_id, target_type, metadata)
    VALUES (NEW.user_id, 'group_join', NEW.group_id, 'group', jsonb_build_object('group_id', NEW.group_id));
END IF;
RETURN NEW;
END;
$$;

-- Trigger for group members
DROP TRIGGER IF EXISTS group_join_activity_trigger ON group_members;
CREATE TRIGGER group_join_activity_trigger
    AFTER INSERT
    ON group_members
    FOR EACH ROW
    EXECUTE FUNCTION track_group_join_activity();

-- Trigger function for follows
CREATE
OR REPLACE FUNCTION track_follow_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF
(TG_OP = 'INSERT') THEN
    INSERT INTO activities (user_id, activity_type, target_id, target_type, metadata)
    VALUES (NEW.follower_id, 'follow', NEW.following_id, 'profile', jsonb_build_object('following_id', NEW.following_id));
END IF;
RETURN NEW;
END;
$$;

-- Trigger for follows
DROP TRIGGER IF EXISTS follow_activity_trigger ON follows;
CREATE TRIGGER follow_activity_trigger
    AFTER INSERT
    ON follows
    FOR EACH ROW
    EXECUTE FUNCTION track_follow_activity();

-- Removed friend_requests trigger since that table doesn't exist

-- Trigger function for post creation
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
    VALUES (NEW.user_id, 'post', NEW.id, 'post', jsonb_build_object('post_id', NEW.id, 'content_rating', NEW.content_rating));
END IF;
RETURN NEW;
END;
$$;

-- Trigger for post creation
DROP TRIGGER IF EXISTS post_creation_activity_trigger ON posts;
CREATE TRIGGER post_creation_activity_trigger
    AFTER INSERT
    ON posts
    FOR EACH ROW
    EXECUTE FUNCTION track_post_creation_activity();

-- Trigger function for comments
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

-- Trigger for comments
DROP TRIGGER IF EXISTS comment_activity_trigger ON comments;
CREATE TRIGGER comment_activity_trigger
    AFTER INSERT
    ON comments
    FOR EACH ROW
    EXECUTE FUNCTION track_comment_activity();

-- Update the handle_new_user function to include account_type
CREATE
OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
INSERT INTO public.profiles (id, username, display_name, account_type)
VALUES (new.id,
        COALESCE(new.raw_user_meta_data ->> 'username', SPLIT_PART(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data ->> 'display_name', SPLIT_PART(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data ->> 'account_type', 'personal')) ON CONFLICT (id) DO NOTHING;
RETURN new;
END;
$$;

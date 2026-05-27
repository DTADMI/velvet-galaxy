-- 055_security_hardening.rollback.sql
-- Restores direct execution on internal helper functions.

DO $$
DECLARE
  fn_signature TEXT;
BEGIN
  FOREACH fn_signature IN ARRAY ARRAY[
    'public.handle_new_user()',
    'public.check_rate_limit(uuid, inet, text, integer, integer)'
  ]
  LOOP
    IF to_regprocedure(fn_signature) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO PUBLIC', fn_signature);
  END LOOP;
END $$;

-- Rollback: Remove node_color column from external_profiles
-- WARNING: This drops the column and all data in it

ALTER TABLE public.external_profiles
    DROP COLUMN IF EXISTS node_color;

-- Migration: Fix external_profiles table to add node_color column
-- Description: Add node_color column to external_profiles if it doesn't exist

-- Add node_color column to external_profiles
ALTER TABLE public.external_profiles
    ADD COLUMN IF NOT EXISTS node_color VARCHAR (7) DEFAULT '#6b7280';

-- Update existing records to have default color if null
UPDATE public.external_profiles
SET node_color = '#6b7280'
WHERE node_color IS NULL;

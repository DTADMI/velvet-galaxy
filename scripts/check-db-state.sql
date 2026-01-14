-- Database State Check
-- Run this in Supabase SQL Editor to see current database state

-- 1. Check if migrations table exists
SELECT EXISTS (SELECT
               FROM information_schema.tables
               WHERE table_schema = 'public'
                 AND table_name = 'schema_migrations') as migrations_table_exists;

-- 2. List all executed migrations (if table exists)
SELECT version, name, executed_at
FROM schema_migrations
ORDER BY version;

-- 3. List all tables in public schema
SELECT tablename, tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Check for critical tables
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles')          as has_profiles,
       EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'posts')             as has_posts,
       EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'feature_flags')     as has_feature_flags,
       EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages')          as has_messages,
       EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketplace_items') as has_marketplace;

-- 5. Check profiles table structure (including is_admin column)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 6. Check feature_flags table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'feature_flags'
ORDER BY ordinal_position;

-- 7. List current feature flags
SELECT name, description, is_enabled, created_at
FROM feature_flags
ORDER BY name;

-- 8. Count records in key tables
SELECT (SELECT COUNT(*) FROM profiles)      as profile_count,
       (SELECT COUNT(*) FROM posts)         as post_count,
       (SELECT COUNT(*) FROM feature_flags) as feature_flag_count;

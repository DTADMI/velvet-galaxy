# Database Migrations

This directory contains SQL migration scripts for the Velvet Galaxy database.

## Overview

Migrations are numbered sequentially (001, 002, 003, etc.) and should be run in order. Each migration file contains SQL
statements to create or modify database schema.

## Migration Files

- `000_create_migrations_table.sql` - Creates the migrations tracking system
- `001_create_profiles.sql` - User profiles
- `002_create_posts.sql` - Posts and feed
- `003_create_messages.sql` - Messaging system
- `004_create_marketplace.sql` - Marketplace listings
- `005_create_media_system.sql` - Media uploads
- `006_create_follow_system.sql` - Follow/follower relationships
- `007_create_events_and_groups.sql` - Events and groups
- `008_create_chat_rooms.sql` - Chat rooms
- `009_add_content_rating_and_enhancements.sql` - Content ratings
- `009_create_relationships.sql` - Friend relationships
- `010_add_comments_bookmarks_shares.sql` - Social features
- `011_create_storage_buckets.sql` - File storage
- `012_create_subscriptions.sql` - Premium subscriptions
- `013_add_rate_limiting.sql` - Rate limiting
- `014_create_comments.sql` - Comment system
- And more... (see directory listing)

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended) ✅

This is the easiest and safest method:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy the contents of each migration file in numerical order
6. Execute each migration
7. Verify no errors

**Start with:**

1. `000_create_migrations_table.sql` (creates tracking system)
2. `040_create_feature_flags.sql` (fixes current error)
3. Then run any other missing migrations in numerical order

### Option 2: Shell Script

If you have direct database access:

```bash
# Make script executable
chmod +x scripts/run-migrations.sh

# Set your database URL (get from Supabase Dashboard > Settings > Database)
export SUPABASE_DB_URL='postgresql://postgres:[password]@[host]:5432/postgres'

# Run the script
./scripts/run-migrations.sh
```

### Option 3: PostgreSQL CLI

If you have `psql` installed:

```bash
# Get connection string from Supabase Dashboard
export DB_URL='your-connection-string'

# Run specific migration
psql "$DB_URL" -f scripts/040_create_feature_flags.sql

# Or run all migrations
for f in scripts/[0-9][0-9][0-9]_*.sql; do
    echo "Running $f..."
    psql "$DB_URL" -f "$f"
done
```

## Checking Migration Status

To see which migrations have been executed:

```sql
SELECT version, name, executed_at
FROM schema_migrations
ORDER BY version;
```

Run this query in Supabase SQL Editor to see migration history.

## Creating New Migrations

1. **Create a new file** with the next sequential number:
   ```bash
   touch scripts/041_your_migration_name.sql
   ```

2. **Write your SQL**:
   ```sql
   -- Description of what this migration does
   
   CREATE TABLE IF NOT EXISTS ...
   
   -- Always use IF NOT EXISTS for safety
   -- Always include rollback comments
   ```

3. **Test locally first** if possible

4. **Run in production** via Supabase Dashboard

5. **Verify** the migration was successful

## Best Practices

✅ **DO:**

- Always use `IF NOT EXISTS` for CREATE statements
- Always use `IF EXISTS` for DROP statements
- Number migrations sequentially
- Include descriptive comments
- Test migrations before running in production
- Keep migrations idempotent (can run multiple times safely)

❌ **DON'T:**

- Modify existing migration files (create new ones instead)
- Skip migration numbers
- Run migrations out of order
- Delete migration files
- Modify data in schema migrations (use separate seed scripts)

## Troubleshooting

### "Table already exists" error

- Use `IF NOT EXISTS` in your CREATE statements
- This allows migrations to be re-run safely

### "Column already exists" error

- Use `ADD COLUMN IF NOT EXISTS` for ALTER TABLE statements

### "Feature_flags table not found" error

- Run `scripts/040_create_feature_flags.sql` in Supabase SQL Editor

### Checking database state

```sql
-- List all tables
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public';

-- Check specific table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'your_table_name';
```

## Migration Tracking

The `schema_migrations` table tracks which migrations have been executed:

```sql
CREATE TABLE schema_migrations
(
    id          SERIAL PRIMARY KEY,
    version     TEXT UNIQUE NOT NULL,
    name        TEXT        NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT now(),
    checksum    TEXT
);
```

After running a migration manually, you can record it:

```sql
INSERT INTO schema_migrations (version, name)
VALUES ('040', 'create feature flags');
```

## Recent Migrations

### Custom Relationships & External Profiles System

**042_create_custom_relationships.sql** - Custom relationship types and relationship requests

- `custom_relationship_types` - User-defined relationship types with labels and colors
- `user_relationships` - Relationship requests and connections between users
- Status workflow: pending → accepted/declined/blocked

**043_add_line_styles.sql** - Line styles and external profiles for 3D map

- Adds `line_style` to custom_relationship_types (solid, dashed, dotted, double, wavy)
- Adds `display_order` and `is_visible_on_map` to custom_relationship_types
- `external_profiles` - Profiles for people not on the network
- `external_relationships` - Relationships with external profiles
- Enables custom visual representation of relationship types on network map

## Current Priority

🔥 **Run these migrations in order:**

1. `000_create_migrations_table.sql` - Setup migration tracking
2. `040_create_feature_flags.sql` - Feature flags system
3. `042_create_custom_relationships.sql` - Custom relationship types
4. `043_add_line_styles.sql` - Line styles and external profiles

Then check which other migrations are needed by reviewing error logs.

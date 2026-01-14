# Database Migration Guide for Velvet Galaxy

## Quick Answer to Your Questions

### What does `supabase db push` do?

`supabase db push` is a Supabase CLI command that:

- Pushes local database migrations to your remote Supabase project
- **Requires**: Supabase CLI installed + local Supabase project initialized
- **Status**: ❌ Not set up in this project (no CLI, no `supabase/` folder)

### Does it run all SQL scripts in `/scripts` and `/sql`?

No. The Supabase CLI only runs migrations from `supabase/migrations/` directory if configured. Your project uses a *
*manual migration system** with scripts in `/scripts` and `/sql`.

### How do I check which scripts have been run?

Run this query in **Supabase SQL Editor**:

```sql
SELECT version, name, executed_at
FROM schema_migrations
ORDER BY version;
```

Or use the comprehensive check script:

- Copy contents of `scripts/check-db-state.sql`
- Paste into Supabase SQL Editor
- Run it to see full database state

### How do I make sure the database is up-to-date?

## ✅ IMMEDIATE ACTION REQUIRED

Your database is missing the `feature_flags` table, causing errors. Here's how to fix it:

### Step 1: Create Migrations Table (First Time Only)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy the entire contents of `scripts/000_create_migrations_table.sql`
6. Paste into the editor
7. Click **Run** (or press Ctrl+Enter)
8. Verify success (should see "Success. No rows returned")

### Step 2: Run Required Migrations

Run these migrations in order:

**A. Feature Flags System**

1. In SQL Editor, create a new query
2. Copy the entire contents of `scripts/040_create_feature_flags.sql`
3. Paste and run
4. Verify success

**B. Custom Relationships (New!)**

1. Create a new query
2. Copy the entire contents of `scripts/042_create_custom_relationships.sql`
3. Paste and run
4. Verify success

**C. Line Styles & External Profiles (New!)**

1. Create a new query
2. Copy the entire contents of `scripts/043_add_line_styles.sql`
3. Paste and run
4. Verify success

This adds support for:

- Custom relationship types with labels and colors
- Multiple edges between nodes with different styles
- Line styles (solid, dashed, dotted, double, wavy)
- External profiles for people not on the network
- Visual legend on 3D network map

### Step 3: Check Database State

1. Create new query in SQL Editor
2. Copy contents of `scripts/check-db-state.sql`
3. Run it
4. Review the results to see:
    - Which tables exist
    - Which migrations have been run
    - Table structures (profiles, feature_flags, etc.)
    - Current feature flags

### Step 4: Run Any Missing Migrations

Based on the check results, run any missing migrations in numerical order:

- `001_create_profiles.sql`
- `002_create_posts.sql`
- `003_create_messages.sql`
- etc.

**Important**: Skip migrations that created tables you already have.

## 🔧 Alternative Methods

### Method A: Use Migration Helper Script

```bash
# View migration status and get instructions
pnpm db:migrate
```

This will show you all migrations and provide guidance.

### Method B: If You Have Database Connection String

1. Get your connection string:
    - Supabase Dashboard → Settings → Database
    - Copy "Connection string" (Transaction mode)

2. Set environment variable:
   ```bash
   export SUPABASE_DB_URL='postgresql://postgres:[password]@[host]:5432/postgres'
   ```

3. Run migrations:
   ```bash
   chmod +x scripts/run-migrations.sh
   ./scripts/run-migrations.sh
   ```

### Method C: Manual PostgreSQL

```bash
# If you have psql installed
psql "your-connection-string" -f scripts/040_create_feature_flags.sql
```

## 📊 Migration Tracking System

This project now has a migration tracking system:

### How It Works

1. **Migrations table** (`schema_migrations`) tracks what's been run
2. Each migration is recorded with:
    - Version number (001, 002, etc.)
    - Name
    - Execution timestamp
    - Checksum (to detect changes)

3. Before running a migration, check if it's been executed:
   ```sql
   SELECT * FROM schema_migrations WHERE version = '040';
   ```

4. After manually running a migration, record it:
   ```sql
   INSERT INTO schema_migrations (version, name) 
   VALUES ('040', 'create feature flags');
   ```

## 📝 Current Migration Status

Based on your error, here's what needs to happen:

| Migration                       | Status    | Action                             |
|---------------------------------|-----------|------------------------------------|
| 000_create_migrations_table.sql | ❓ Unknown | Run first                          |
| 040_create_feature_flags.sql    | ❌ Missing | **Run ASAP** - Fixes current error |
| All others                      | ❓ Unknown | Check with `check-db-state.sql`    |

## 🎯 Recommended Workflow

### For Now (Quick Fix)

1. Run `000_create_migrations_table.sql` in Supabase SQL Editor
2. Run `040_create_feature_flags.sql` in Supabase SQL Editor
3. Verify app works

### Going Forward

1. Before creating new migrations, run `check-db-state.sql` to see current state
2. Create new migration file: `scripts/041_your_feature.sql`
3. Test the SQL in Supabase SQL Editor
4. Record in migrations table after running
5. Commit both the SQL file and note the migration in your changelog

## 🔍 Useful Commands

```bash
# Check what migrations exist locally
ls -l scripts/[0-9][0-9][0-9]_*.sql

# Count migrations
ls -1 scripts/[0-9][0-9][0-9]_*.sql | wc -l

# View migration helper
pnpm db:migrate
```

## ⚠️ Important Notes

- **Never modify existing migration files** - create new ones instead
- **Always use IF NOT EXISTS** to make migrations idempotent
- **Test in SQL Editor first** before automating
- **Keep migrations in version control**
- **Document breaking changes** in migration comments

## 🆘 Troubleshooting

### Error: "Table already exists"

✅ This is fine if using `IF NOT EXISTS`. Migration is idempotent.

### Error: "Column already exists"

✅ This is fine if using `ADD COLUMN IF NOT EXISTS`.

### Error: "feature_flags table not found"

❌ Run `scripts/040_create_feature_flags.sql` immediately.

### Error: "is_admin column does not exist"

❌ Fixed in updated `040_create_feature_flags.sql` - it now adds this column.

### How do I reset everything?

⚠️ **Dangerous** - Only for development:

```sql
-- In SQL Editor
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then run all migrations from 000 onwards
```

## 📚 Additional Resources

- Supabase Docs: https://supabase.com/docs/guides/database/overview
- Migration README: `scripts/README.md`
- Check script: `scripts/check-db-state.sql`

---

**Need help?** Run `pnpm db:migrate` for interactive guidance.

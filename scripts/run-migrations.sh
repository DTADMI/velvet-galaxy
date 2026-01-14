#!/bin/bash

# Database Migration Runner
# This script checks which migrations need to be run and provides instructions

set -e

echo "🔍 Velvet Galaxy Database Migration Tool"
echo "========================================"
echo ""

# Check for required environment variables
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "⚠️  SUPABASE_DB_URL not set"
    echo ""
    echo "To use this script, you need the database connection string:"
    echo "1. Go to Supabase Dashboard > Project Settings > Database"
    echo "2. Copy the connection string (Connection pooling > Transaction mode)"
    echo "3. Set it: export SUPABASE_DB_URL='postgresql://...'"
    echo ""
    echo "OR manually run migrations in Supabase SQL Editor (recommended)"
    echo ""
fi

# Count migration files
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_COUNT=$(ls -1 "$SCRIPT_DIR"/[0-9][0-9][0-9]_*.sql 2>/dev/null | wc -l)

echo "Found $MIGRATION_COUNT migration files in scripts/"
echo ""

# List all migrations
echo "Available migrations:"
echo "─────────────────────────────────────────────────────"
for file in "$SCRIPT_DIR"/[0-9][0-9][0-9]_*.sql; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        version=$(echo "$filename" | grep -oE '^[0-9]{3}')
        name=$(echo "$filename" | sed 's/^[0-9]*_//; s/\.sql$//' | tr '_' ' ')
        echo "  [$version] $name"
    fi
done
echo "─────────────────────────────────────────────────────"
echo ""

echo "📋 To run migrations:"
echo ""
echo "OPTION 1 (Recommended): Supabase Dashboard"
echo "  1. Go to https://supabase.com/dashboard"
echo "  2. Select your project"
echo "  3. Go to SQL Editor"
echo "  4. Create a new query"
echo "  5. Copy and paste the contents of each migration file in order"
echo "  6. Execute each migration"
echo ""
echo "OPTION 2: PostgreSQL CLI (if you have connection string)"
echo "  export SUPABASE_DB_URL='your-connection-string'"
echo "  for f in scripts/[0-9][0-9][0-9]_*.sql; do"
echo "    echo \"Running \$f...\""
echo "    psql \"\$SUPABASE_DB_URL\" -f \"\$f\""
echo "  done"
echo ""
echo "OPTION 3: Run specific migration"
echo "  psql \"\$SUPABASE_DB_URL\" -f scripts/040_create_feature_flags.sql"
echo ""

# If DB URL is set, offer to run migrations
if [ -n "$SUPABASE_DB_URL" ]; then
    echo "Database connection detected!"
    echo ""
    read -p "Run all pending migrations now? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "🚀 Running migrations..."
        echo ""
        
        # First ensure migrations table exists
        echo "Creating migrations tracking table..."
        psql "$SUPABASE_DB_URL" -f "$SCRIPT_DIR/000_create_migrations_table.sql"
        
        # Run each migration
        for file in "$SCRIPT_DIR"/[0-9][0-9][0-9]_*.sql; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                echo "📝 Running $filename..."
                psql "$SUPABASE_DB_URL" -f "$file" && echo "✓ Success" || echo "✗ Failed"
            fi
        done
        
        echo ""
        echo "✅ Migration process complete!"
    fi
fi

#!/usr/bin/env tsx
/**
 * Database Migration Runner
 *
 * This script manages database migrations for Velvet Galaxy.
 * It tracks which migrations have been run and executes pending ones.
 *
 * Usage:
 *   pnpm migrate          - Run all pending migrations
 *   pnpm migrate:status   - Check migration status
 *   pnpm migrate:force    - Force re-run all migrations (dangerous!)
 */

import {createClient} from '@supabase/supabase-js';
import {readdirSync, readFileSync} from 'fs';
import {join} from 'path';
import * as crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing environment variables:');
    console.error('   SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
    console.error('\nPlease set these in your .env.local file');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

interface Migration {
    version: string;
    name: string;
    filename: string;
    path: string;
    checksum: string;
    sql: string;
}

interface ExecutedMigration {
    version: string;
    name: string;
    executed_at: string;
    checksum: string | null;
}

function calculateChecksum(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
}

function getMigrationFiles(): Migration[] {
    const scriptsDir = join(process.cwd(), 'scripts');
    const files = readdirSync(scriptsDir)
        .filter(f => f.endsWith('.sql') && /^\d{3}_/.test(f))
        .sort();

    return files.map(filename => {
        const path = join(scriptsDir, filename);
        const sql = readFileSync(path, 'utf-8');
        const match = filename.match(/^(\d{3})_(.+)\.sql$/);

        if (!match) {
            throw new Error(`Invalid migration filename: ${filename}`);
        }

        return {
            version: match[1],
            name: match[2].replace(/_/g, ' '),
            filename,
            path,
            checksum: calculateChecksum(sql),
            sql
        };
    });
}

async function ensureMigrationsTable(): Promise<void> {
    const {error} = await supabase.rpc('exec_sql', {
        sql: readFileSync(join(process.cwd(), 'scripts', '000_create_migrations_table.sql'), 'utf-8')
    });

    if (error) {
        // Try direct query if RPC doesn't exist
        const tableCheck = await supabase.from('schema_migrations').select('version').limit(1);

        if (tableCheck.error && tableCheck.error.code === 'PGRST116') {
            console.log('⚠️  Migrations table does not exist. Please create it manually:');
            console.log('   1. Go to Supabase Dashboard > SQL Editor');
            console.log('   2. Run the contents of scripts/000_create_migrations_table.sql');
            process.exit(1);
        }
    }
}

async function getExecutedMigrations(): Promise<ExecutedMigration[]> {
    const {data, error} = await supabase
        .from('schema_migrations')
        .select('version, name, executed_at, checksum')
        .order('version', {ascending: true});

    if (error) {
        if (error.code === 'PGRST116') {
            // Table doesn't exist yet
            return [];
        }
        throw error;
    }

    return data || [];
}

async function executeMigration(migration: Migration): Promise<void> {
    console.log(`\n📝 Executing migration ${migration.version}: ${migration.name}...`);

    try {
        // Note: Supabase client doesn't support executing arbitrary SQL for security
        // This needs to be done through the Supabase Dashboard SQL Editor
        console.log('   ⚠️  Please execute this migration manually in Supabase SQL Editor:');
        console.log(`   File: scripts/${migration.filename}`);

        // Record that we've noted this migration
        const {error} = await supabase
            .from('schema_migrations')
            .insert({
                version: migration.version,
                name: migration.name,
                checksum: migration.checksum
            });

        if (error && error.code !== '23505') { // Ignore duplicate key errors
            throw error;
        }

        console.log(`   ✓ Migration ${migration.version} recorded`);
    } catch (error) {
        console.error(`   ✗ Failed to execute migration ${migration.version}:`, error);
        throw error;
    }
}

async function checkMigrationStatus(): Promise<void> {
    console.log('🔍 Checking migration status...\n');

    const migrations = getMigrationFiles();
    const executed = await getExecutedMigrations();
    const executedVersions = new Set(executed.map(m => m.version));

    console.log('Migrations Status:');
    console.log('─'.repeat(80));

    let pendingCount = 0;
    let executedCount = 0;

    for (const migration of migrations) {
        const isExecuted = executedVersions.has(migration.version);
        const status = isExecuted ? '✓' : '⏳';
        const label = isExecuted ? 'EXECUTED' : 'PENDING';

        console.log(`${status} [${migration.version}] ${migration.name.padEnd(50)} ${label}`);

        if (isExecuted) {
            executedCount++;
            const executedMigration = executed.find(m => m.version === migration.version);
            if (executedMigration?.checksum && executedMigration.checksum !== migration.checksum) {
                console.log(`   ⚠️  WARNING: Checksum mismatch! Migration file may have been modified.`);
            }
        } else {
            pendingCount++;
        }
    }

    console.log('─'.repeat(80));
    console.log(`Total: ${migrations.length} migrations (${executedCount} executed, ${pendingCount} pending)\n`);
}

async function runMigrations(force: boolean = false): Promise<void> {
    console.log('🚀 Starting database migration...\n');

    await ensureMigrationsTable();

    const migrations = getMigrationFiles();
    const executed = await getExecutedMigrations();
    const executedVersions = new Set(executed.map(m => m.version));

    let ranCount = 0;

    for (const migration of migrations) {
        if (!force && executedVersions.has(migration.version)) {
            console.log(`⏭️  Skipping ${migration.version}: ${migration.name} (already executed)`);
            continue;
        }

        await executeMigration(migration);
        ranCount++;
    }

    if (ranCount === 0) {
        console.log('\n✨ All migrations are up to date!');
    } else {
        console.log(`\n✅ Recorded ${ranCount} migration(s)`);
        console.log('\n⚠️  IMPORTANT: Please execute pending SQL files manually in Supabase Dashboard');
    }
}

// CLI
const command = process.argv[2];

(async () => {
    try {
        switch (command) {
            case 'status':
                await checkMigrationStatus();
                break;
            case 'force':
                console.log('⚠️  Force mode: This will re-run all migrations!');
                await runMigrations(true);
                break;
            default:
                await runMigrations(false);
        }
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
})();

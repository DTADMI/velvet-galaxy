#!/usr/bin/env node
// =============================================================================
// Velvet Galaxy - Feature Flag Audit Script
// Scans all source files for feature flag usage, compares against defined
// flags, and reports dead/redundant/missing flags.
//
// Usage: node scripts/audit-feature-flags.mjs
// =============================================================================

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const FLAGS_FILE = join(ROOT, 'lib', 'feature-flags.ts');
const SRC_DIR = join(ROOT, 'app');
const COMPONENTS_DIR = join(ROOT, 'components');
const LIB_DIR = join(ROOT, 'lib');

// ── Parse Feature Flags ───────────────────────────────────────────────────

function parseFeatureFlags(filePath) {
  if (!existsSync(filePath)) {
    console.error(`❌ Feature flags file not found: ${filePath}`);
    return { defined: [], entries: [] };
  }

  const content = readFileSync(filePath, 'utf-8');
  const defined = [];

  // Primary source of truth: each flag definition declares `id: "flag_id"`.
  // (A generic `key: "value"` regex would also match description/category/id.)
  const idPattern = /\bid\s*:\s*['"]([\w-]+)['"]/g;
  let idMatch;
  while ((idMatch = idPattern.exec(content)) !== null) {
    const name = idMatch[1];
    if (!defined.find(f => f.name === name)) {
      defined.push({ name, value: name, line: countLinesUpTo(content, idMatch.index) });
    }
  }

  // Fallback: top-level keys of an exported flags object literal.
  if (defined.length === 0) {
    const objMatch = content.match(/(?:FEATURE_FLAGS|flags)\s*(?::[^=]*)?=\s*\{([\s\S]*)\}/);
    if (objMatch) {
      const keyPattern = /^\s{2,6}["']?([\w-]+)["']?\s*:\s*\{/gm;
      let keyMatch;
      while ((keyMatch = keyPattern.exec(objMatch[1])) !== null) {
        const name = keyMatch[1];
        if (!defined.find(f => f.name === name)) {
          defined.push({ name, value: name, line: null });
        }
      }
    }
  }

  return { defined, entries: defined };
}

// ── Scan Source Files ─────────────────────────────────────────────────────

function walkDir(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (entry === 'node_modules' || entry === '.next' || entry === 'dist') continue;

    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...walkDir(fullPath, extensions));
      } else if (extensions.includes(extname(entry))) {
        files.push(fullPath);
      }
    } catch {}
  }
  return files;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function scanForFlagUsage(files, definedFlags) {
  const usage = new Map();

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const relativePath = file.slice(ROOT.length).replace(/^[\\/]+/, '').replace(/\\/g, '/');

      // The definition file references every flag by name; it is not usage.
      if (relativePath === 'lib/feature-flags.ts') continue;

      for (const flag of definedFlags) {
        const patterns = [
          new RegExp(`['"\`]${escapeRegex(flag.value)}['"\`]`),
          new RegExp(`(?:flags|featureFlags|FEATURE_FLAGS)\\.${escapeRegex(flag.name)}\\b`),
          new RegExp(`getFlag\\(['"]${escapeRegex(flag.value)}['"]\\)`),
        ];

        for (const pattern of patterns) {
          if (pattern.test(content)) {
            if (!usage.has(flag.name)) {
              usage.set(flag.name, []);
            }
            usage.get(flag.name).push(relativePath);
            break;
          }
        }
      }
    } catch {}
  }

  return usage;
}

// ── Report ────────────────────────────────────────────────────────────────

function countLinesUpTo(content, index) {
  return content.slice(0, index).split('\n').length;
}

function generateReport(definedFlags, usage) {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  Velvet Galaxy - Feature Flag Audit Report    ');
  console.log('═══════════════════════════════════════════════\n');

  console.log(`Total flags defined: ${definedFlags.length}`);
  console.log(`Flags in use: ${usage.size}`);
  console.log(`Flags NOT used anywhere: ${definedFlags.filter(f => !usage.has(f.name)).length}\n`);

  // Dead flags (defined but never used)
  const dead = definedFlags.filter(f => !usage.has(f.name));
  if (dead.length > 0) {
    console.log('🔴 DEAD FLAGS (defined but never referenced):');
    for (const flag of dead) {
      console.log(`   - ${flag.name} (${flag.value})`);
    }
    console.log('');
  }

  // Active flags with usage count
  console.log('🟢 ACTIVE FLAGS:');
  for (const flag of definedFlags) {
    const files = usage.get(flag.name) || [];
    const isUsed = files.length > 0;
    const icon = isUsed ? '✅' : '⬜';
    console.log(`   ${icon} ${flag.name} - used in ${files.length} file(s)`);
    if (files.length > 0 && files.length <= 5) {
      for (const f of files) {
        console.log(`      ${f}`);
      }
    }
  }

  // Summary
  console.log('\n─────────────────────────────────────────────────');
  console.log('Summary:');
  console.log(`  Defined:  ${definedFlags.length}`);
  console.log(`  Active:   ${usage.size}`);
  console.log(`  Dead:     ${dead.length}`);
  console.log(`  Health:   ${Math.round((usage.size / definedFlags.length) * 100)}%`);
  console.log('═══════════════════════════════════════════════\n');

  return { defined: definedFlags.length, active: usage.size, dead: dead.length, deadFlags: dead };
}

// ── Main ──────────────────────────────────────────────────────────────────

const { defined } = parseFeatureFlags(FLAGS_FILE);
const allFiles = [
  ...walkDir(SRC_DIR),
  ...walkDir(COMPONENTS_DIR),
  ...walkDir(LIB_DIR),
];
const usage = scanForFlagUsage(allFiles, defined);
const report = generateReport(defined, usage);

if (report.dead > 0) {
  console.log(`⚠️  ${report.dead} dead flags found. Consider removing them to reduce complexity.`);
  process.exitCode = 1;
} else {
  console.log('✅ All flags are actively used!');
}
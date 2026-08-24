#!/usr/bin/env node
// =============================================================================
// Velvet Galaxy — i18n Coverage Audit Script
// Scans all source files for hardcoded strings and missing translation keys.
//
// Usage: node scripts/audit-i18n.mjs
// =============================================================================

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const TRANSLATIONS_DIR = join(ROOT, 'lib', 'i18n', 'dictionaries');
const SRC_DIRS = [join(ROOT, 'app'), join(ROOT, 'components'), join(ROOT, 'lib')];

// ── Load Translation Files ────────────────────────────────────────────────

function loadTranslations(dir) {
  if (!existsSync(dir)) {
    console.error(`❌ Translations directory not found: ${dir}`);
    return {};
  }

  const files = readdirSync(dir).filter(f => f.endsWith('.ts'));
  const translations = {};

  for (const file of files) {
    const locale = file.replace('.ts', '');
    const content = readFileSync(join(dir, file), 'utf-8');

    // Extract all string keys
    const keys = new Set();
    const keyPattern = /\b(\w+)\s*:\s*['"]([^'"]*)['"]/g;
    let match;
    while ((match = keyPattern.exec(content)) !== null) {
      keys.add(match[1]);
    }

    translations[locale] = { path: join(dir, file), keys, raw: content };
  }

  return translations;
}

// ── Scan Source Files ─────────────────────────────────────────────────────

function walkDir(dir) {
  const files = [];
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (entry === 'node_modules' || entry === '.next' || entry === 'dist') continue;

    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...walkDir(fullPath));
      } else if (['.ts', '.tsx', '.js', '.jsx'].includes(extname(entry))) {
        files.push(fullPath);
      }
    } catch {}
  }
  return files;
}

function scanForHardcodedStrings(files) {
  const violations = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const relativePath = file.replace(ROOT + '/', '');

      // Skip test files and generated files
      if (relativePath.includes('.spec.') || relativePath.includes('.test.') ||
          relativePath.includes('__tests__') || relativePath.includes('node_modules')) {
        continue;
      }

      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip comments and imports
        if (line.trim().startsWith('//') || line.trim().startsWith('*') ||
            line.trim().startsWith('/*') || line.startsWith('import ')) {
          continue;
        }

        // Find hardcoded English strings in JSX/TSX content
        const textMatches = [
          // JSX text content: <p>Some text</p>
          ...line.matchAll(/>([A-Z][a-z]{2,}(?:\s+[a-z]{2,}){1,})</g),
          // aria-labels, titles with English text
          ...line.matchAll(/(?:aria-label|title|placeholder)=["']([A-Z][a-z]{2,}(?:\s+[a-z]{2,}){1,})["']/g),
          // Button/label text that looks English
          ...line.matchAll(/>\s*(Log\s*in|Sign\s*up|Submit|Cancel|Save|Delete|Edit|Create|Search|Next|Previous|Back|Close)\s*</gi),
        ];

        for (const match of textMatches) {
          const text = match[1]?.trim();
          if (text && text.length > 2 && !/^\d+$/.test(text)) {
            violations.push({
              file: relativePath,
              line: i + 1,
              text,
              type: 'hardcoded-string',
            });
          }
        }
      }
    } catch {}
  }

  return violations;
}

// ── Compare Translation Keys Across Locales ───────────────────────────────

function compareTranslationCoverage(translations) {
  const locales = Object.keys(translations);
  if (locales.length < 2) {
    console.log('⚠️  Only one locale found — nothing to compare');
    return [];
  }

  const allKeys = new Set();
  for (const locale of locales) {
    for (const key of translations[locale].keys) {
      allKeys.add(key);
    }
  }

  const gaps = [];
  for (const key of allKeys) {
    const missingLocales = locales.filter(l => !translations[l].keys.has(key));
    if (missingLocales.length > 0) {
      gaps.push({ key, missingLocales });
    }
  }

  return gaps;
}

// ── Report ────────────────────────────────────────────────────────────────

function generateReport(translations, hardcoded, gaps) {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  Velvet Galaxy — i18n Coverage Audit Report   ');
  console.log('═══════════════════════════════════════════════\n');

  // Locale summary
  const locales = Object.keys(translations);
  console.log(`Locales found: ${locales.join(', ')} (${locales.length})`);
  for (const locale of locales) {
    console.log(`  ${locale}: ${translations[locale].keys.size} keys`);
  }
  console.log('');

  // Gap report
  if (gaps.length > 0) {
    console.log(`🔴 TRANSLATION GAPS (${gaps.length} keys missing in some locales):`);
    for (const gap of gaps.slice(0, 20)) {
      console.log(`   - "${gap.key}" missing in: ${gap.missingLocales.join(', ')}`);
    }
    if (gaps.length > 20) {
      console.log(`   ... and ${gaps.length - 20} more`);
    }
    console.log('');
  } else {
    console.log('✅ All locales have complete translation coverage\n');
  }

  // Hardcoded strings
  if (hardcoded.length > 0) {
    console.log(`🔴 HARDCODED STRINGS (${hardcoded.length} potential violations):`);
    // Group by file
    const byFile = {};
    for (const v of hardcoded.slice(0, 30)) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }
    for (const [file, violations] of Object.entries(byFile)) {
      console.log(`   ${file}:`);
      for (const v of violations) {
        console.log(`      L${v.line}: "${v.text}"`);
      }
    }
    if (hardcoded.length > 30) {
      console.log(`   ... and ${hardcoded.length - 30} more`);
    }
    console.log('');
  } else {
    console.log('✅ No hardcoded strings detected\n');
  }

  // Summary
  console.log('─────────────────────────────────────────────────');
  console.log('Summary:');
  console.log(`  Locales:        ${locales.length}`);
  console.log(`  Total keys:     ${new Set(locales.flatMap(l => [...translations[l].keys])).size}`);
  console.log(`  Translation gaps: ${gaps.length}`);
  console.log(`  Hardcoded strings: ${hardcoded.length}`);
  console.log(`  Health:          ${gaps.length === 0 && hardcoded.length === 0 ? '✅ PASS' : '⚠️  NEEDS WORK'}`);
  console.log('═══════════════════════════════════════════════\n');

  return { localeCount: locales.length, gaps: gaps.length, hardcoded: hardcoded.length };
}

// ── Main ──────────────────────────────────────────────────────────────────

const translations = loadTranslations(TRANSLATIONS_DIR);
const allFiles = SRC_DIRS.flatMap(dir => walkDir(dir));
const hardcoded = scanForHardcodedStrings(allFiles);
const gaps = compareTranslationCoverage(translations);
const report = generateReport(translations, hardcoded, gaps);

if (report.gaps > 0 || report.hardcoded > 0) {
  process.exitCode = 1;
}
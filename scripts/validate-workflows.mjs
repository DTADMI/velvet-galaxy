#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * validate-workflows.mjs — GitHub Actions workflow YAML validator
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Validates all .github/workflows/*.yml for:
 *   1. Valid YAML syntax (parse check via 'yaml' package if available)
 *   2. Mandatory 'name' key
 *   3. 'permissions' must not be empty or null
 *   4. 'on' trigger event must be a valid mapping
 *   5. No duplicate top-level keys
 *   6. 'jobs' must be a non-empty mapping
 *
 * ════════════════════════ TWO-TIER FALLBACK ═══════════════════════════════════
 * Tier 1: Full YAML parsing via the 'yaml' npm package (exact line positions).
 * Tier 2: Regex-based heuristics if 'yaml' is not installed. Catches the most
 *          common bugs (empty permissions, duplicate keys) without any deps.
 *
 * Usage: node scripts/validate-workflows.mjs
 * Exit:  0 = all clean | 1 = errors found
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const WORKFLOW_DIR = ".github/workflows";
const __dirname = dirname(fileURLToPath(import.meta.url));
let errors = 0;

function err(file, msg) {
  console.error(`  ❌ ${file}: ${msg}`);
  errors++;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER 1 — Full YAML parsing (yaml package available)
// ═══════════════════════════════════════════════════════════════════════════════

let yamlPkg = null;

function loadYaml() {
  if (yamlPkg !== null) return yamlPkg;
  try {
    const _require = createRequire(import.meta.url);
    // Try project-local node_modules first
    const candidates = [
      join(process.cwd(), "node_modules", "yaml"),
      join(dirname(fileURLToPath(import.meta.url)), "..", "node_modules", "yaml"),
    ];
    let mod = null;
    for (const c of candidates) {
      try { mod = _require(c); break; } catch { /* continue */ }
    }
    if (!mod) mod = _require("yaml");
    yamlPkg = mod;
    return mod;
  } catch {
    yamlPkg = false; // signal "not available"
    return null;
  }
}

function validateYamlFull(file, raw) {
  const YAML = loadYaml();
  if (!YAML) return false; // fall through to tier 2

  let doc;
  try {
    doc = YAML.parse(raw);
  } catch (e) {
    if (e instanceof YAML.YAMLParseError) {
      const lines = raw.split("\n");
      const lineNum = e.linePos?.[0]?.line ?? "?";
      const snippet = lines[Number(lineNum) - 1] ?? "";
      err(file, `YAML syntax error at line ${lineNum}: ${e.message}\n    → ${snippet.trim()}`);
    } else {
      err(file, `YAML parse error: ${e.message}`);
    }
    return true;
  }

  if (!doc || typeof doc !== "object") {
    err(file, "parsed to non-object — file may be empty or invalid");
    return true;
  }

  // Semantic checks
  if (!doc.name) err(file, "missing 'name' key — all workflows should have a readable name");

  if (!doc.on) {
    err(file, "missing 'on' trigger — workflow won't run");
  } else if (typeof doc.on !== "object" && typeof doc.on !== "string") {
    err(file, "'on' must be a string or mapping — check syntax");
  }

  if (!doc.jobs) {
    err(file, "missing 'jobs' key — workflow has no jobs defined");
  } else if (typeof doc.jobs !== "object" || Array.isArray(doc.jobs)) {
    err(file, "'jobs' must be a mapping");
  } else if (Object.keys(doc.jobs).length === 0) {
    err(file, "'jobs' is empty — workflow needs at least one job");
  }

  // permissions: empty mapping bug
  if ("permissions" in doc) {
    const p = doc.permissions;
    if (p === null || p === undefined) {
      err(file, "permissions: is null/undefined — must be a mapping (e.g. 'contents: read') or remove the key entirely");
    } else if (typeof p !== "object" || Array.isArray(p)) {
      err(file, "permissions: must be a mapping, got " + (Array.isArray(p) ? "array" : typeof p));
    } else if (Object.keys(p).length === 0) {
      err(file, "permissions: is empty mapping {} — either set at least one scope (e.g. 'contents: read') or delete the key entirely");
    }
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER 2 — Regex-based fallback (zero dependencies)
// ═══════════════════════════════════════════════════════════════════════════════

function validateYamlTier2(file, raw) {
  // Check for empty permissions: — the exact bug we encountered
  // Pattern: permissions: on its own line with NO values indented underneath.
  // Valid:   permissions:\n  contents: read
  // Bug:     permissions:\n\nconcurrency:\n  contents: read  (orphaned under concurrency)
  const permMatch = raw.match(/^permissions:\s*$/m);
  if (permMatch) {
    const idx = raw.indexOf(permMatch[0]);
    const after = idx + permMatch[0].length;
    const lineNum = (raw.substring(0, idx).match(/\n/g) || []).length + 1;
    const nextLines = raw.substring(after).split("\n").slice(0, 5);

    // Check if the first non-empty indented line IS a permission scope
    // (valid: permissions: with values on following lines)
    const firstIndented = nextLines.find((l) => l.trim() !== "" && l.startsWith(" "));
    const PERM_SCOPES = /^\s{2,}(contents|actions|checks|deployments|id-token|issues|packages|pages|pull-requests|statuses|repository-projects|organization-projects|security-events|attestations|discussions)\s*:/;

    if (firstIndented && PERM_SCOPES.test(firstIndented)) {
      // Valid — permissions: has properly indented scopes
      // No error to flag
    } else {
      // Empty or orphaned — error
      const hasOrphanedScopes = nextLines.some((l) => PERM_SCOPES.test(l));
      if (hasOrphanedScopes) {
        err(file, `permissions: has orphaned scopes (line ${lineNum}) — move scopes under permissions: or delete the key`);
      } else {
        err(file, `permissions: is empty mapping (line ${lineNum}) — set at least one scope (e.g. 'contents: read') or delete the key`);
      }
    }
  }

  // Check for duplicate top-level keys
  const lines = raw.split("\n");
  const topKeys = [];
  for (const line of lines) {
    const m = line.match(/^(\w[\w-]*)\s*:/);
    if (m && !line.startsWith(" ") && !line.startsWith("#") && !line.startsWith("-")) {
      topKeys.push(m[1]);
    }
  }
  const seen = new Set();
  for (const k of topKeys) {
    if (seen.has(k)) {
      err(file, `duplicate top-level key '${k}' — this is invalid YAML and GitHub will reject it`);
      break;
    }
    seen.add(k);
  }

  // Basic structural checks via regex
  if (!/^name:\s*(.+)$/m.test(raw)) {
    err(file, "missing 'name' key — all workflows should have a readable name");
  }
  if (!/^on:\s*$/m.test(raw) && !/^on:\s+\w/m.test(raw)) {
    err(file, "missing 'on' trigger — workflow won't run");
  }
  if (!/^jobs:\s*$/m.test(raw)) {
    err(file, "missing 'jobs' key — workflow has no jobs defined");
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Orchestration
// ═══════════════════════════════════════════════════════════════════════════════

function validate(filePath) {
  const file = basename(filePath);
  let raw;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch (e) {
    err(file, `cannot read file: ${e.message}`);
    return;
  }

  // Try tier 1 (full YAML parse), fall through to tier 2
  const usedTier1 = validateYamlFull(file, raw);
  if (!usedTier1) {
    validateYamlTier2(file, raw);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const dir = join(process.cwd(), WORKFLOW_DIR);
  let files;
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
  } catch {
    console.log("  ⚠️  No .github/workflows directory found — skipping workflow validation.");
    process.exit(0);
  }

  if (files.length === 0) {
    console.log("  ⚠️  No workflow files found — skipping.");
    process.exit(0);
  }

  // Detect tier
  const yaml = loadYaml();
  const tierLabel = yaml ? "full YAML parse (yaml package)" : "regex-based (install 'yaml' for exact positions)";
  console.log(`  🔍 Validating ${files.length} workflow(s) [${tierLabel}]…`);
  errors = 0;
  for (const f of files) {
    validate(join(dir, f));
  }

  if (errors > 0) {
    console.error(`\n  ❌ ${errors} workflow validation error(s) found.`);
    console.error("  Fix them before committing — broken workflows fail silently in GitHub Actions.\n");
    process.exit(1);
  }

  if (!yaml) {
    console.log("  💡 Install 'yaml' as devDependency for exact error positions.");
  }
  console.log(`  ✅ All ${files.length} workflow(s) valid.\n`);
}

main();
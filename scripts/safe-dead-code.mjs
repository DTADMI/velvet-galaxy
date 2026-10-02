#!/usr/bin/env node
/**
 * safe-dead-code.mjs - rapport de code non atteignable (lecture seule).
 *
 * Ce script est SANS RISQUE : il ne supprime ni ne modifie aucun fichier. Il
 * construit le graphe d'imports a partir des points d'entree Next.js et signale
 * les fichiers de source qui ne sont atteignables depuis aucun d'eux. Le resultat
 * est une HEURISTIQUE (imports resolus par chemin, pas par analyse de types) : un
 * fichier signale doit etre confirme avant toute suppression.
 *
 * Usage :
 *   node scripts/safe-dead-code.mjs           rapport lisible
 *   node scripts/safe-dead-code.mjs --json    sortie JSON
 *   node scripts/safe-dead-code.mjs --fail    sort 1 si des fichiers sont orphelins
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative, resolve, extname } from "node:path";

const ROOT = process.cwd();
const SRC_DIRS = ["app", "components", "lib", "hooks", "src"];
const EXT = [".ts", ".tsx", ".js", ".jsx", ".mjs"];
const SKIP = new Set(["node_modules", ".next", "dist", "build", "out", "coverage", "public", "tests", "__tests__", "e2e"]);
const ENTRY_RE = /(?:^|\/)(?:page|layout|route|loading|error|global-error|not-found|template|default|opengraph-image|sitemap|robots|icon|apple-icon)\.(?:tsx?|jsx?)$/;
const asJson = process.argv.includes("--json");
const shouldFail = process.argv.includes("--fail");

function walk(dir, out) {
  let es; try { es = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of es) {
    if (e.name.startsWith(".") || SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && EXT.includes(extname(e.name))) out.push(p);
  }
}

function resolveSpecifier(fromFile, spec) {
  let base;
  if (spec.startsWith("@/")) base = join(ROOT, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec);
  else return null; // paquet externe
  for (const ext of ["", ...EXT, ...EXT.map((x) => `/index${x}`)]) {
    const candidate = base + ext;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const files = [];
for (const d of SRC_DIRS) if (existsSync(join(ROOT, d))) walk(join(ROOT, d), files);
if (existsSync(join(ROOT, "middleware.ts"))) files.push(join(ROOT, "middleware.ts"));

const imports = new Map();
for (const f of files) {
  const text = readFileSync(f, "utf8");
  const specs = new Set();
  for (const m of text.matchAll(/(?:from|import|require)\s*\(?\s*["']([^"']+)["']/g)) specs.add(m[1]);
  const targets = new Set();
  for (const spec of specs) {
    const t = resolveSpecifier(f, spec);
    if (t) targets.add(t);
  }
  imports.set(f, targets);
}

const entries = files.filter((f) => ENTRY_RE.test(f) || f.endsWith("middleware.ts"));
const reached = new Set(entries);
const queue = [...entries];
while (queue.length) {
  const f = queue.pop();
  for (const t of imports.get(f) ?? []) {
    if (!reached.has(t)) { reached.add(t); queue.push(t); }
  }
}

const orphans = files.filter((f) => !reached.has(f)).map((f) => relative(ROOT, f)).sort();

if (asJson) {
  console.log(JSON.stringify({ entries: entries.length, files: files.length, orphans }, null, 2));
} else {
  console.log(`Points d'entree: ${entries.length} | fichiers analyses: ${files.length}`);
  console.log(`Fichiers non atteignables (heuristique): ${orphans.length}`);
  for (const o of orphans) console.log(`  - ${o}`);
  console.log("\nRapport seulement : confirmer avant toute suppression.");
}
process.exit(shouldFail && orphans.length ? 1 : 0);

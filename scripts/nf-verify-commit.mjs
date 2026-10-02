#!/usr/bin/env node
/**
 * nf-verify-commit.mjs - detect a partially committed change set.
 *
 * Failure class this catches
 * --------------------------
 * `git commit -- <paths>` takes the *working tree* content of the named paths
 * and ignores everything else. When two agent sessions work in the same repo and
 * both touch the same files, the session that commits first silently absorbs the
 * other session's edits to those files, while any *new* file the other session
 * added remains untracked and is left out of the commit.
 *
 * That is exactly what happened in quest-hunt-web on 2026-09-27: the commit
 * `c4c97fc1` contained `lib/i18n/provider.tsx` and `lib/i18n/server.ts` with an
 * `import ... from "./translate"`, but `lib/i18n/translate.ts` was never added.
 * The repository was broken at HEAD and the broken commit had already been
 * pushed to both remotes. Nothing in the toolchain noticed: typecheck and build
 * run against the working tree, where the file does exist.
 *
 * What it does
 * ------------
 * Extract the *relative* imports of the source files of a revision and verify
 * that each resolved target also exists in that same revision. Relative imports
 * are the ones that break in this scenario; package imports and configured path
 * aliases are resolved by the toolchain and are out of scope here.
 *
 * Modes
 *   (default)   check the files changed by the revision
 *   --tree      check every source file of the revision (use this as a pre-push
 *               gate: it also catches a dangling import introduced by an earlier
 *               commit whose importing file is not part of the current commit)
 *
 * Usage
 *   node scripts/nf-verify-commit.mjs                 # changed files of HEAD
 *   node scripts/nf-verify-commit.mjs <rev>           # changed files of <rev>
 *   node scripts/nf-verify-commit.mjs --tree          # whole tree at HEAD
 *   node scripts/nf-verify-commit.mjs --tree <rev>    # whole tree at <rev>
 *
 * Exit code 1 when at least one relative import cannot be resolved inside the
 * revision, meaning the revision is not self-consistent.
 */

import { execFileSync } from "node:child_process";

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".mjs", ".cjs", ".js", ".jsx"];
const RESOLUTION_SUFFIXES = [
  "",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".js",
  ".jsx",
  "/index.ts",
  "/index.tsx",
  "/index.js",
];

const IMPORT_PATTERNS = [
  /\bfrom\s*["'](\.[^"']+)["']/g,
  /\bimport\s*\(\s*["'](\.[^"']+)["']\s*\)/g,
  /\brequire\s*\(\s*["'](\.[^"']+)["']\s*\)/g,
];

/**
 * Agent tooling, archived scratch, and generated output are not product code, so
 * a repository-wide consistency gate must not fail on them.
 *
 * Prefixes handle top-level trees. Segments catch the same names nested anywhere
 * (`<pkg>/dist/`, `scripts/_archive/`): a smoke-test script that imports
 * `../dist/foo.js` refers to a build artifact that is deliberately untracked, and
 * an archived script may keep a dangling import forever. Both would otherwise
 * make `--tree` fail on a perfectly buildable revision (observed in pi-studio,
 * 2026-09-27: 4 false positives that would block every push).
 */
const EXCLUDED_PREFIXES = [".pi/", ".next/", "node_modules/", "coverage/", "test-results/"];
const EXCLUDED_SEGMENTS = [
  "_archive",
  "dist",
  "build",
  "target",
  "playwright-report",
  ".next",
  "node_modules",
  "coverage",
  "test-results",
];

const isExcluded = (path) =>
  EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix)) ||
  path.split("/").some((segment) => EXCLUDED_SEGMENTS.includes(segment));

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function isSourceFile(path) {
  return !isExcluded(path) && SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension));
}

/** All tracked paths of a revision, as a lookup set. One git call, fast. */
function treePaths(revision) {
  const raw = execFileSync("git", ["ls-tree", "-r", "-z", "--name-only", revision], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return new Set(raw.split("\0").filter(Boolean));
}

function changedSourceFiles(revision) {
  const raw = execFileSync(
    "git",
    ["diff-tree", "--no-commit-id", "--name-only", "-r", "--diff-filter=d", revision],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(isSourceFile);
}

/**
 * Remove comments before scanning.
 *
 * Without this the checker reports its own documentation as a broken import: the
 * header of this file quotes an example import of a file that was missing from a
 * commit, and a text scan cannot tell that example from real code. The same
 * applies to any file that documents an import inside a comment.
 */
function stripComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");
}

function relativeImports(content) {
  const source = stripComments(content);
  const imports = new Set();
  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) imports.add(match[1]);
  }
  return imports;
}

function resolveCandidates(importPath, sourceFile) {
  const base = sourceFile.split("/").slice(0, -1);
  const parts = [...base];
  for (const segment of importPath.split("/")) {
    if (segment === "." || segment === "") continue;
    if (segment === "..") parts.pop();
    else parts.push(segment);
  }
  const normalized = parts.join("/");
  const candidates = new Set(RESOLUTION_SUFFIXES.map((suffix) => normalized + suffix));

  // TypeScript ESM convention: a source file imports "./x.js" while the file on
  // disk is "./x.ts". Without this remap the checker reports a false positive on
  // perfectly valid imports.
  const extensionMatch = normalized.match(/\.(js|mjs|cjs)$/);
  if (extensionMatch) {
    const withoutExtension = normalized.slice(0, -extensionMatch[0].length);
    for (const suffix of RESOLUTION_SUFFIXES) {
      candidates.add(withoutExtension + suffix);
      if (suffix === "") continue;
    }
    candidates.add(`${withoutExtension}.ts`);
    candidates.add(`${withoutExtension}.tsx`);
    candidates.add(`${withoutExtension}.mjs`);
    candidates.add(`${withoutExtension}.cjs`);
  }

  return [...candidates];
}

function main() {
  const args = process.argv.slice(2);
  const useTree = args.includes("--tree");
  const revision = args.find((a) => !a.startsWith("--")) ?? "HEAD";

  let available;
  let targets;
  try {
    available = treePaths(revision);
    targets = useTree ? [...available].filter(isSourceFile) : changedSourceFiles(revision);
  } catch (error) {
    console.error(`error: cannot read revision "${revision}": ${String(error.message).split("\n")[0]}`);
    return 2;
  }

  if (targets.length === 0) {
    console.log(`verify-commit: nothing to check in ${revision}.`);
    return 0;
  }

  let broken = 0;
  let checked = 0;
  const reported = new Set();

  for (const file of targets) {
    let content;
    try {
      content = git(["show", `${revision}:${file}`]);
    } catch {
      continue;
    }
    for (const importPath of relativeImports(content)) {
      checked += 1;
      const key = `${file}\0${importPath}`;
      if (reported.has(key)) continue;
      const candidates = resolveCandidates(importPath, file);
      if (candidates.some((candidate) => available.has(candidate))) {
        continue;
      }
      // An import into a generated or archived tree (e.g. `../dist/x.js`) is out
      // of scope: the artifact is produced by the build, not committed.
      if (candidates.some((candidate) => isExcluded(candidate))) {
        continue;
      }
      reported.add(key);
      broken += 1;
      console.error(
        `  BROKEN  ${file} imports "${importPath}"\n          no such file in ${revision}`,
      );
    }
  }

  console.log(
    `verify-commit: ${targets.length} file(s), ${checked} relative import(s) checked against ${revision}${useTree ? " (whole tree)" : ""}.`,
  );
  if (broken > 0) {
    console.error(`\nverify-commit FAILED: ${broken} relative import(s) unresolved in ${revision}.`);
    console.error(
      "This usually means a commit captured imports from another session's working tree\n" +
        "without capturing the new files those imports refer to. Add the missing files in\n" +
        "a follow-up commit before pushing.",
    );
    return 1;
  }
  console.log("verify-commit: the revision resolves its own relative imports.");
  return 0;
}

process.exit(main());

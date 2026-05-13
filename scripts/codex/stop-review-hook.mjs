import { spawnSync } from "node:child_process";

function gitChangedPaths() {
  const result = spawnSync("git", ["status", "--short"], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.slice(3).trim());
}

const changedPaths = gitChangedPaths();

if (changedPaths.length === 0) {
  process.exit(0);
}

const reminders = [];
const touchesUi = changedPaths.some((path) => /^(app|components|hooks)\//.test(path));
const touchesDocs = changedPaths.some((path) => /^docs\//.test(path));
const touchesDb = changedPaths.some(
  (path) => /^scripts\/\d+_.*\.sql$/.test(path) || /^sql\//.test(path)
);
const touchesAgentTooling = changedPaths.some(
  (path) => /^(AGENTS\.md|\.agents\/|\.codex\/|plugins\/velvet-integrations\/|scripts\/codex\/)/.test(path)
);

if (touchesUi) {
  reminders.push("UI changes detected: confirm responsive behavior, hover states, and 320px validation.");
}

if (touchesDocs) {
  reminders.push("Docs changes detected: keep docs indexes and action-plan references aligned with source-of-truth changes.");
}

if (touchesDb) {
  reminders.push(
    "DB changes detected: confirm paired rollout/rollback files, schema parity, preview_schema refresh, and migration validation."
  );
}

if (touchesAgentTooling) {
  reminders.push("Agent tooling changed: confirm rules/hooks/skills/plugins layer integrity.");
}

if (reminders.length === 0) {
  process.exit(0);
}

console.log("Velvet Galaxy stop review reminders:");
for (const reminder of reminders) {
  console.log(`- ${reminder}`);
}

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const migrationsDir = join(root, "scripts");
const hardeningFloor = 55;
let errors = 0;

function fail(message) {
  console.error(`[check-supabase-security] ${message}`);
  errors += 1;
}

function getStatement(content, startIndex) {
  const endIndex = content.indexOf(";", startIndex);
  return content.slice(startIndex, endIndex === -1 ? undefined : endIndex + 1);
}

const files = readdirSync(migrationsDir)
  .filter((file) => /^\d{3}_.*\.sql$/.test(file) && !file.includes(".rollout") && !file.includes(".rollback"))
  .sort();

for (const file of files) {
  const migrationNumber = Number.parseInt(file.slice(0, 3), 10);
  if (Number.isNaN(migrationNumber) || migrationNumber < hardeningFloor) {
    continue;
  }

  const fullPath = join(migrationsDir, file);
  const content = readFileSync(fullPath, "utf8");
  const viewRegex = /create\s+(?:or\s+replace\s+)?view\s+((?:[a-z0-9_]+\.)?[a-z0-9_]+)/gi;
  let match;

  while ((match = viewRegex.exec(content)) !== null) {
    const objectName = match[1].toLowerCase();
    const statement = getStatement(content, match.index);
    const inPublicSchema = !objectName.includes(".") || objectName.startsWith("public.");

    if (!inPublicSchema) {
      continue;
    }

    if (!/with\s*\(\s*security_invoker\s*=\s*(?:true|'true'|on)\s*\)/i.test(statement)) {
      fail(`${file}: public view ${objectName} must declare WITH (security_invoker = true).`);
    }
  }

  const blocks = content.split(/(?=create\s+or\s+replace\s+function)/i);

  for (const block of blocks) {
    if (!/security\s+definer/i.test(block)) {
      continue;
    }

    const functionMatch = block.match(/create\s+or\s+replace\s+function\s+((?:[a-z0-9_]+\.)?[a-z0-9_]+)/i);
    if (!functionMatch) {
      continue;
    }

    const functionName = functionMatch[1].toLowerCase();
    const bareFunctionName = functionName.replace(/^public\./, "");

    const revokePattern = new RegExp(
      `revoke\\s+(?:all|execute)\\s+on\\s+function\\s+public\\.${bareFunctionName}\\s*\\(`,
      "i",
    );

    if (!revokePattern.test(content)) {
      fail(`${file}: SECURITY DEFINER function ${functionName} must revoke public execute access in the same migration.`);
    }
  }
}

if (errors > 0) {
  process.exit(1);
}

console.log("[check-supabase-security] No new public-schema advisor regressions found.");

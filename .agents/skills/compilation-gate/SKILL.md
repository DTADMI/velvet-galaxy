# Compilation Gate — Skill

**Owner:** Nebula Forge Digital Studio
**Version:** 2.0
**Applies To:** All NF projects with compiled languages
**Rule Reference:** NF-GATE-001 in root AGENTS.md

## Purpose

Prevent the class of bugs where code is generated blind — written to disk without
compilation feedback — resulting in errors only discovered when the user tries to
build, deploy, or run tests.

This skill was created after an August 2026 incident where a script generated
Rust code across 7 files without running cargo check, producing 11 compilation
errors + 9 silent logic bugs. The root cause: text replacement without any
compilation loop.

## Trigger

This skill fires a reminder when an agent:
- Writes or edits >= 5 files without running the compiler
- Runs a script that does text replacement on compiled source files
- Creates new Rust (.rs), TypeScript (.ts/.tsx), SQL, or Kotlin files

## Procedure

### 1. Identify the project compilation commands

| Language | Command | Notes |
| --- | --- | --- |
| TypeScript | npx tsc --noEmit --pretty false | Run from project root |
| Rust | cd src-tauri && cargo check --color always | Adjust path per project |
| Next.js | pnpm build | Catches route segment config + type errors |
| SQL Migration | psql -f <file> --dry-run | Validate syntax before applying |

### 2. Run after every batch

After writing or editing >= 3 compiled files, run the compiler. Fix ALL errors
before proceeding to the next batch.

### 3. Script-generated code — mandatory compilation

Scripts that generate or modify compiled source files via text replacement
MUST follow this pattern:

    1. Write files to disk
    2. Run the compiler(s) on affected files
    3. Print results to stdout
    4. Abort (exit non-zero) on compilation failure
    5. Never rely on the user or a later step to discover errors

See scripts/code-generation-guard.mjs for a reusable template.

### 4. Feature-gate awareness (Tauri 2)

Tauri 2 modules behind Cargo features:

| Module | Required Feature |
| --- | --- |
| tauri::tray | tray-icon |
| tauri-plugin-notification | Add to Cargo.toml deps |
| tauri::clipboard | clipboard |

### 5. Module Triple-Check Rule (Rust)

When adding src-tauri/src/commands/foo.rs:
1. mod.rs: Add pub mod foo;
2. lib.rs: Add use commands::{..., foo};
3. lib.rs: Register commands in invoke_handler![] OR call from .setup()

All three locations MUST agree.

## Known Pitfall Classes (14)

| # | Pattern | Symptom | Fix |
| --- | --- | --- | --- |
| 1 | Blind script generation | Errors at build time | End scripts with compiler check |
| 2 | Missing Cargo feature | could not find X in tauri | Enable feature in Cargo.toml |
| 3 | Missing mod declaration | no X in commands | Add pub mod X in mod.rs |
| 4 | Unsafe edition 2024 | call to unsafe function | Add unsafe { } block + safety comment |
| 5 | Closure type inference | type annotations needed | Annotate parameters explicitly |
| 6 | Overnight range math | 21<=h && h<=5 always false | Use h>=start || h<=end (wrap-around) |
| 7 | block_on deadlock | Cannot block the current thread | Use spawn() instead of block_on() |
| 8 | Volatile credential storage | set_var lost on restart | File-backed Mutex or OS keychain |
| 9 | Borrow outlives spawn | borrowed data escapes | Clone before async spawn |
| 10 | Dead #[command] | Registered but never called | Call init functions from .setup() |
| 11 | Missing dependency crate | unresolved module | Add crate to Cargo.toml |
| 12 | Lifetime mismatch | Reference escapes closure | Clone AppHandle before move |
| 13 | Unused variable warning | unused variable in Rust | Prefix with _ or remove |
| 14 | Hardcoded unknown cost | isCostUnknown: 0 means free | Distinguish unknown from free |

## Defense Layers

    1. AGENTS.md — NF-GATE-001 rule (must compile after every batch)
    2. This skill — automatic reminder + procedure + pitfalls
    3. code-generation-guard.mjs — reusable compilation wrapper
    4. Pre-commit hook — blocks commits with compilation errors
    5. CI workflow — blocks PRs with compilation errors

## Enforcement

- Pre-commit: .githooks/pre-commit runs cargo check and tsc --noEmit
- CI: GitHub Actions build job fails on compilation error
- This skill: fires reminder >= 5 consecutive file writes without compilation
- Root audit: scripts/audit-reusable-artifacts.mjs checks all hooks + skills exist

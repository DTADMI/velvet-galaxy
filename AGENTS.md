# AGENTS.md

## Purpose

- Keep repo-loaded agent instructions short, stable, and enforceable.
- Use this file for hard repo rules only.
- Put procedural workflows in skills, runtime automation in hooks, and external system access in MCP/plugins.
- Read root `AGENTS.md` at the repo root for cross-project governance rules.
- Don't Do Evil. Never Do Evil.

## Operating Model

| Layer | Location | Use It For | Do Not Put Here |
| --- | --- | --- | --- |
| Rules | `AGENTS.md` | Stable repo policy, safety constraints, required guardrails | Long step-by-step playbooks, external integration setup |
| Hooks | `.codex/hooks.json`, `.githooks/pre-commit` | Automated reminders and enforced validation entrypoints | Product rules that need human judgment |
| Skills | `.agents/skills/` | Repeatable Velvet Galaxy workflows that require repo-specific procedure | Global policy, generic shell preferences |
| MCP / Plugins | `plugins/velvet-integrations/`, `.agents/plugins/marketplace.json` | External system access and integration metadata | Repo policy or authoring standards |

## Repository Map

- `app/` Next.js App Router pages and API routes (auth, feed, profile, messages, marketplace, media, admin, search, events, groups, notifications, settings)
- `components/` shared UI (post, media, profile, messaging, marketplace, search, auth, admin, network visualization, portal)
- `hooks/` client hooks (feature flags, infinite scroll, mobile, locale, TTS, toast, tags)
- `lib/` shared logic, Supabase helpers, i18n, admin roles, rate limiting, Stripe, subscription helpers
- `scripts/` SQL migrations, DB utilities
- `sql/` supplemental SQL (schema, seed, feature flags, marketplace, toy reviews)
- `styles/` global CSS
- `tests/` Vitest unit tests and Playwright e2e tests
- `docs/` technical documentation

## Hard Rules

### Search And Shell

- Use `rg` first and by default for repo search.
- Scope searches and avoid heavy folders: `node_modules`, `.next`, `test-results`, `.qodo`, `.idea`.
- Never use `Get-ChildItem -Recurse | Select-String` for repo content search.
- For data-heavy work, prefer repo scripts over repeated manual tool calls when a script is practical.

### Change Safety

- Do not remove or overwrite user changes in a dirty worktree unless explicitly asked.
- Avoid editing generated output or `.next/`.
- Keep new product behavior behind feature flags, and keep UI/API enforcement in sync.
- Growth ideas, themes, and events must remain feature-flag gated and controllable from the admin dashboard.
- Vendor-dependent integrations must go through local adapters, not direct vendor SDK calls in feature code.

### Social Platform Rules

- Keep UI responsive and mobile-first across all surfaces; validate at `320px` minimum.
- All user-facing copy must be user-facing; internal operator language belongs only on admin/moderator surfaces.
- Content moderation flows must respect user privacy and follow the report-dismiss-review lifecycle.
- The relationship system (friend, follow, custom labels) must enforce mutual consent and respect privacy settings.
- Media uploads must strip EXIF data by default and apply content-rating (SFW/NSFW) visibility rules.
- Marketplace listings must follow Stripe integration patterns and keep purchase flows secure.
- The network visualization must degrade gracefully on mobile (2D fallback, reduced node count).
- Keep the Velvet Galaxy brand naming consistent: "VG" / "Velvet Galaxy" across UI and docs.

### Migrations And Data

- Migrations live in `scripts/###_*.sql`.
- Every migration must have paired rollout and rollback SQL files.
- Verify schema parity across local, preview, and prod before and after DB-affecting changes unless an approved exception is documented.
- Every new table must enable RLS with explicit policies.
- Every `SECURITY DEFINER` function must set an explicit least-privilege `search_path`.

### Validation, Docs, And Commits

- Keep documentation aligned with code and schema changes.
- Keep `action-plan.md` current when source-of-truth work changes active priorities or shipped status.
- In docs, keep exactly one empty line between a section title and the start of its table.
- Use real emoji characters in docs and keep docs UTF-8 clean.
- When code or docs change, create a concise commit unless the user says not to.

### Security And Privacy

- Do not log or expose secrets from `.env`, `.env.local`, or other environment files.
- Keep EXIF stripping defaults for photo uploads.
- Security events such as MFA changes and suspicious-device events must emit both in-app and transactional email notifications.

## Skills To Use

Use the repo skills when the task matches:

- `content-moderation-review`: handle reports, content rating, moderation queues, and admin review workflows.
- `social-graph-management`: manage relationships, custom labels, privacy scoping, and consent flows.
- `marketplace-operations`: manage listings, Stripe integration, purchase flows, and digital product delivery.
- `media-pipeline`: handle upload validation, EXIF stripping, media viewer security, album management, and ephemeral content.
- `subscription-management`: manage subscription tiers, Stripe webhooks, access gating, and plan lifecycle.
- `brand-copy-velvet`: review user-facing copy, VG-specific naming, tone, and terminology consistency.

## Hooks And Enforced Checks

- Active Codex lifecycle hooks live in `.codex/hooks.json`.
- Repo Git hooks live in `.githooks/` and are installed by `node scripts/install-git-hooks.mjs` (or equivalent).
- The pre-commit hook runs `pnpm lint`, `pnpm build`, and `pnpm test`.

## MCP And Plugin Boundaries

- Repo-owned MCP/plugin metadata lives under `plugins/velvet-integrations/` and `.agents/plugins/marketplace.json`.
- Current MCP targets are GitHub and Supabase.
- Use MCP for external context and inspection. Do not treat MCP as the source of truth for repo-side rollout scripts, migrations, or docs updates.
- Keep active runtime hooks in `.codex/hooks.json`; do not rely on plugin-local hooks for repo enforcement.

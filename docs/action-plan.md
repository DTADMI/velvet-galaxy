# Action Plan — Velvet Galaxy

**Last Updated**: 2026-06-13

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ Done | Completed |
| 🔵 In Progress | Currently being worked on |
| 🟡 Planned | Scheduled but not started |
| ❌ Blocked | Cannot proceed due to external dependency |

## Phase 1: Foundation (Complete)

| # | Task | Status |
|---|------|--------|
| 1 | Next.js 16 scaffold with App Router | ✅ Done |
| 2 | AGENTS.md with hard rules | ✅ Done |
| 3 | Feature flags (23 flags across core, AI, Neo4j) | ✅ Done |
| 4 | Supabase Auth integration (@supabase/ssr) | ✅ Done |
| 5 | i18n system with FR default (4 locales: fr, en, es, de) | ✅ Done |
| 6 | Encoding reference and fix scripts | ✅ Done |
| 7 | Pre-commit hooks (lint, typecheck, test, build, encoding) | ✅ Done |
| 8 | Performance optimization doc | ✅ Done |
| 9 | Radix UI integration with optimizePackageImports | ✅ Done |
| 10 | PPR enabled (experimental.ppr: 'incremental') | ✅ Done |
| 11 | Version pinning: Node >=24.0.0, pnpm 11.5.0 | ✅ Done |

## Phase 2: Critical Infrastructure (June 2026)

| # | Task | Status |
|---|------|--------|
| 1 | Gap analysis and implementation roadmap | ✅ Done |
| 2 | Neo4j integration plan | ✅ Done |
| 3 | AI features implementation plan | ✅ Done |
| 4 | Artist architecture design | ✅ Done |
| 5 | TanStack Query migration from SWR | ✅ Done |
| 6 | Modularity assessment (3 critical monoliths identified) | ✅ Done |

## Phase 3: Remaining Gaps

| # | Gap | Priority | Status |
|---|-----|----------|--------|
| 1 | Caching: No Redis caching layer for content (only rate limiting) | High | 🟡 Planned |
| 2 | Testing: Minimal test coverage — unit and e2e needed | High | 🟡 Planned |
| 3 | Error handling: Ad-hoc patterns — need standardized approach | Medium | 🟡 Planned |
| 4 | System health: No monitoring or observability | Medium | 🟡 Planned |
| 5 | Network visualization: 113KB monolith needs refactoring | Medium | 🟡 Planned |
| 6 | Enhanced create post: 51KB monolith needs refactoring | Medium | 🟡 Planned |
| 7 | Chat room view: 60KB monolith needs refactoring | Medium | 🟡 Planned |
| 8 | AI features: Scaffold exists but needs implementation | Low | 🟡 Planned |

## Version Compliance

| Requirement | Current | Target |
|-------------|---------|--------|
| Node.js | >=24.0.0 | 26.3.0 |
| pnpm | 11.5.0 | 11.5.0 |
| Ubuntu CI | 24.04 | 24.04 |

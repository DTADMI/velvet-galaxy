# Velvet Galaxy - Gap Analysis & Action Plan

> **Owner**: Nebula Forge Digital Studio  
> **Last Updated**: 2026-09-12  
> **Status**: 🟢 Audited, deployed (Vercel live)  

---

## Audit Summary

| Metric | Value |
|---|---|
| Pages | 40+ (App Router) |
| Feature Flags | 15 (all used, 0 dead) |
| E2E Tests | 3 Playwright specs + unit suite |
| Components | 80+ |
| Supabase | ✅ (Auth, DB, Storage, Realtime) |
| Stripe | ✅ (subscriptions, marketplace) |
| Redis | ✅ (Upstash) |
| Neo4j | ✅ (graph relationships) |
| AI Integration | ✅ |
| i18n (EN/FR) | ✅ complete (469 keys each) |
| i18n (ES/DE) | ⚠️ partial (36/469 - English fallback active) |
| CI/CD | ✅ |
| Pre-commit | ✅ |
| Encoding scripts | ✅ |
| Migrations | 53 (rollout + rollback pairs) |

---

## Immediate Gap Checklist

| # | Item | Status | Action |
|---|---|---|---|
| 1 | Docs README index | ✅ | Created Aug 2026 |
| 2 | Gaps/roadmap doc | ✅ | Created Aug 2026 |
| 3 | Feature flags testing doc | ✅ | Created Aug 2026 |
| 4 | i18n completeness audit | ✅ | Audit script fixed (JSON dictionaries + dot-path keys); 0 hardcoded strings found |
| 5 | Feature flag audit | ✅ | Audit script fixed; 15 flags, all used, 0 dead |
| 6 | E2E test coverage | 🔧 | 3 specs present; expand critical-path coverage |
| 7 | Performance optimization doc | ✅ | Already present |
| 8 | Encoding reference doc | ✅ | Already present |
| 9 | Mobile strategy | ⚠️ | Social network needs mobile web adaptiveness |
| 10 | Deploy readiness | ⚠️ | Vercel preview/prod setup verification |

## Completed this cycle (2026-09-12)

- [x] `scripts/audit-i18n.mjs` - was reading `dictionaries/*.ts` but the dictionaries are `.json`, so it reported 0 locales and passed vacuously. Now reads `.json`, extracts dot-path keys, and fixes Windows path relativization.
- [x] `scripts/audit-feature-flags.mjs` - was matching any `key: "value"` pair (reported `id` and `category` as flags). Now extracts real flag ids, excludes the definition file from usage, and fixes path relativization.
- [x] Removed the dead flag `beta_chat_rooms` (defined + seeded + tested, but no feature code): dropped from `lib/feature-flags.ts`, `sql/feature-flags.sql`, the docs and the unit tests. The flag audit is now 100% (15/15 used).
- [x] `components/language-selector.tsx` - was wired to the legacy `lib/i18n.ts` and wrote `localStorage["velvet_galaxy-language"]` while the provider reads `localStorage["velvet_galaxy-locale"]`, so **changing the language did nothing**. Now uses the NF `I18nProvider` (`useI18n().setLocale`) and `router.refresh()`.
- [x] `lib/i18n/provider.tsx` - added an English reference fallback so partially translated locales (ES/DE) render English instead of raw keys.
- [x] Removed dead legacy `lib/i18n.ts` (0 importers; it shadowed the `lib/i18n/` directory barrel).

## Remaining Work (prioritized)

| # | Item | Priority | Effort | Notes |
|---|---|---|---|---|
| 1 | Complete ES/DE dictionaries (433 keys each) | 🟡 Medium | 4-6 h | English fallback is active in the meantime; either complete or drop the locales |
| 3 | Expand E2E coverage beyond 3 specs | 🟡 Medium | 2-3 h | Critical paths: auth, marketplace checkout, social graph |
| 4 | Mobile web adaptiveness audit | 🟡 Medium | 2-3 h | `scripts/audit-responsive.mjs` exists (Playwright + 320px) |
| 5 | Vercel preview/prod deploy verification | 🟡 Medium | 1-2 h | Requires account access |
| 6 | Docs-only preview build skip (`ignoreCommand`) | 🟢 Low | 30 m | Reduces Vercel build cost |

## Recommended Actions

### Phase 1 - Documentation (Complete ✅)
- [x] Create `docs/README.md`
- [x] Create `docs/technical/feature-flags-testing.md`
- [x] Create `docs/technical/gaps-roadmap.md`
- [x] Verify existing docs (perf, encoding already present)

### Phase 2 - Feature Audit (Complete ✅)
- [x] Feature flag audit script - `scripts/audit-feature-flags.mjs` (fixed, working)
- [x] i18n coverage audit script - `scripts/audit-i18n.mjs` (fixed, working)
- [x] Responsive audit script - `scripts/audit-responsive.mjs`
- [x] Language selector wired to the NF i18n provider

### Phase 3 - Performance (Complete ✅)
- [x] Lighthouse config - `lighthouserc.mjs` (budgets, perf targets)
- [x] Mobile responsiveness audit - `scripts/audit-responsive.mjs` (Playwright + 320×568)
- [x] Bundle analysis config - `lib/bundle-config.ts` (budgets, optimizePackageImports)

---

*Document generated as part of cross-project audit - updated 2026-09-12*

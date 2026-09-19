# Velvet Galaxy - Feature Flags Reference

> **Owner**: Nebula Forge Digital Studio  
> **Last Updated**: 2026-08-20  
> **Canonical rules**: `../../docs/technical/feature-flags-testing.md` (NF root)

---

## Flag Registry

21 feature flags defined in `lib/feature-flags.ts`. Flags are persisted in Supabase (`public.feature_flags` table) with Redis caching. The admin dashboard provides toggle management.

## Flag Categories

| Category | Count | Flag IDs |
|---|---|---|
| AI Features | 10 | `ai_recommendations`, `ai_content_moderation`, `ai_translation_assist`, `ai_post_composer`, `ai_tag_suggestions`, `ai_content_recommendations`, `ai_people_discovery`, `ai_media_caption`, `ai_chat_assistant`, `ai_onboarding_assistant`, `ai_group_activity` |
| Premium | 3 | `premium_tts`, `advanced_analytics`, `marketplace_video` |
| Social | 1 | `localized_discovery` |
| Graph DB | 3 | `neo4j_graph_queries`, `neo4j_community_detection`, `neo4j_recommendations` |
| Media | 1 | `toy_viewer_3d` |
| Core | 1 | `payments` (Stripe) |
| Experimental | 1 | `design_system_v2` |

## Feature Flag Lifecycle

```
Draft → Staging (enabled for test users) → Canary (percentage rollout) → GA (enabled: true) → Deprecated → Removed
```

## Testing Feature Flags

### Unit Tests
```bash
pnpm test -- tests/unit/lib/feature-flags.test.ts
pnpm test -- tests/unit/lib/feature-flags.server.test.ts
pnpm test -- tests/unit/lib/feature-flags.invalidation.test.ts
```

### E2E Tests
```bash
pnpm test:e2e -- tests/e2e/core.spec.ts
```

### Manual Verification
1. Visit `/admin/flags` to see all flags and their status
2. Toggle a flag and verify gated UI appears/disappears
3. Check Redis cache invalidation: toggle → refresh → verify persistence

### CI Pipeline
- Pre-commit: `pnpm type-check && pnpm lint && pnpm test && pnpm build`
- GitHub Actions: full suite including E2E on PR

## Adding a New Flag

1. Add entry to `lib/feature-flags.ts` with unique `id`, `name`, `description`, `type`, `enabled`, `value`
2. Add DB row via `sql/` seed or migration
3. Add admin UI toggle in the flag matrix
4. Add unit test verifying the gated behavior
5. Add E2E test if the flag gates a user-facing page/feature
6. Update this document

## Current Flag Audit (August 2026)

| Flag | Enabled | Notes |
|---|---|---|
| `payments` | true | Stripe active |
| `premium_tts` | false | Premium feature, pending rollout |
| `advanced_analytics` | false | Premium feature, pending rollout |
| `marketplace_video` | false | Video listings, pending |
| `ai_*` (10 flags) | mixed | AI features phased rollout |
| `neo4j_*` (3 flags) | true | Graph queries active |
| `toy_viewer_3d` | false | 3D viewer, experimental |
| `localized_discovery` | true | Local content discovery |
| `design_system_v2` | false | In progress |

---

*Document maintained by Nebula Forge Digital Studio - August 2026*
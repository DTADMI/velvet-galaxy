# Velvet Galaxy — Modularity Assessment

**Date**: 2026-05-29
**Status**: Social network project; moderate modularity, one critical monolith.

## 1. Component Modularity

### Strengths
- **Reasonable component sizes**: Most components under 10KB
- **Flat component structure** (146 files, 3 dirs) — but files are generally well-scoped
- **Media pipeline**: Components for upload, viewer, gallery, capture, spoiler
- **Social features**: Relationship manager, follow/block buttons, share dialog, notifications

### Critical Monoliths

| File | Size | Issue |
|------|------|-------|
| `app/network/network-visualization.tsx` | 113 KB | Neo4j graph visualization — all rendering, controls, export in one file. ~2,200 lines. |
| `components/enhanced-create-post.tsx` | 51 KB | Post creation with media, polls, tags, location, language. Should split by feature. |
| `app/chat-rooms/[roomId]/chat-room-view.tsx` | 60 KB | Full chat room in one component. |

### Recommendations
1. Split `network-visualization.tsx` into: graph renderer, node editor, edge editor, controls panel, export handler
2. Split `enhanced-create-post.tsx` into: text editor, media picker, poll builder, tag input

## 2. Lib/Service Modularity

### Strengths
- **Clean lib/ organization** (36 files, 7 dirs):
  - `lib/ai/` — DeepSeek adapter with factory pattern
  - `lib/neo4j/` — Graph database client, queries, sync
  - `lib/redis/` — Cache, rate limiting
  - `lib/tanstack/` — React Query provider, hooks, keys
  - `lib/supabase/` — Client, server, middleware
  - `lib/cache/` — Storage abstraction
  - `lib/i18n/` — Config + dictionaries
- **Service separation**: auth, payments (stripe.ts), email, admin, roles each in dedicated files
- **Error handling**: `lib/errors.ts` centralized
- **Audit trail**: `lib/audit.ts`

### Concerns
- **`lib/i18n.ts`** at root level vs `lib/i18n/` subdirectory — dual pattern confusing
- **`lib/rate-limit.ts`** and **`lib/redis/rate-limit.ts`** — potential duplication
- **Components flat in 3 directories** (ui/, root components/) — no domain grouping

## 3. Cross-Project Reuse Potential

| Module | Shareable? | Notes |
|--------|-----------|-------|
| `lib/neo4j/` | Yes | Graph DB pattern used in story-forge, ascent-legacy |
| `lib/tanstack/` | Yes | React Query pattern consistent |
| `lib/ai/` | Partial | DeepSeek adapter unique; factory pattern reusable |
| `lib/redis/` | Yes | Rate-limit + cache pattern shared with 5+ projects |
| `lib/i18n/` | Yes | Follows NF standard pattern |

## 4. Concern Separation

| Concern | Status | Notes |
|---------|--------|-------|
| Auth | Good | Supabase middleware + roles separated |
| Data access | Good | Neo4j + Supabase clean separation |
| UI rendering | Adequate | Components flat but single-responsibility |
| Validation | Missing | No `lib/validation/` — validation likely inline in components |
| Business logic | Good | lib/ files well-scoped |
| Media handling | Good | Upload, viewer, gallery, capture components separated |

## 5. Performance Impact

- **network-visualization.tsx (113KB)** — Heavy bundle impact. Needs dynamic import + code splitting.
- Components flat structure means minimal re-export overhead
- No translation bloat (dictionaries are JSON, much smaller than quest-hunt-web)

## Summary

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Component Modularity | 3/5 | One massive monolith; rest are reasonable |
| Lib/Service Modularity | 4/5 | Clean, well-structured |
| Cross-Project Reuse | 4/5 | Neo4j + Redis + i18n shareable |
| Concern Separation | 3/5 | Missing validation layer |
| Performance Impact | 3/5 | Network visualization hurts code splitting |

**Priority Actions**:
1. Split `network-visualization.tsx` (113KB) into sub-components
2. Add `lib/validation/` module
3. Resolve dual i18n pattern (`lib/i18n.ts` + `lib/i18n/config.ts`)
4. Consolidate rate-limit modules

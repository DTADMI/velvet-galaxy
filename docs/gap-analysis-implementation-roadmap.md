# Velvet Galaxy — Gap Analysis & Implementation Roadmap

> May 15, 2026 — Comprehensive assessment based on codebase audit, reference docs (StoryForge, LibraKeep, QuestHunt), and industry best practices.

---

## Executive Summary

| Area | Status | Priority | Effort | Section |
|---|---|---|---|---|
| **Architecture & Stack** | ✅ Solid | — | — | §1 |
| **Security** | ⚠️ Multiple gaps | 🔴 Critical | 2-3 days | §2 |
| **Caching** | ⚠️ IndexedDB only, no Redis | 🔴 High | 1-2 days | §3 |
| **Rate Limiting** | ⚠️ DB-based, no Redis | 🟡 Medium | 1 day | §4 |
| **AI Features** | ⚠️ Scaffold only, no real AI | 🟡 Medium | 3-5 days | §5 |
| **Neo4J Integration** | 🔜 Planned, not implemented | 🔵 Optional | 2-3 weeks | §6 |
| **Error Handling** | ⚠️ Ad-hoc, no strategy | 🟡 Medium | 2 days | §7 |
| **TanStack Query** | ❌ Using SWR instead | 🟢 Low | 3-5 days | §8 |
| **UI/UX Feedback** | ⚠️ Inconsistent patterns | 🟡 Medium | 2-3 days | §9 |
| **System Health** | ❌ No monitoring | 🟡 Medium | 2 days | §10 |
| **Library CVEs** | ⚠️ Needs audit & upgrades | 🔴 High | 1 day | §11 |
| **Documentation** | ⚠️ Sparse, outdated | 🟡 Medium | Ongoing | §12 |

---

## §1 Architecture & Stack Assessment

### Current Stack (Production-Ready)

| Layer | Technology | Status | Notes |
|---|---|---|---|
| **Frontend** | Next.js 16 + React 19 + TypeScript 5.9 | ✅ | App Router |
| **Styling** | Tailwind CSS 4 + shadcn/ui (new-york) | ✅ | Full component library |
| **Auth** | Supabase Auth via `@supabase/ssr` | ✅ | Cookie-based session |
| **Database** | Supabase Postgres (direct SDK) | ✅ | 60+ migrations |
| **Storage** | Supabase Storage (media + private-media) | ✅ | RLS-protected |
| **Realtime** | Supabase Realtime channels | ✅ | Activity feeds, notifications |
| **Cache** | SWR + IndexedDB | ⚠️ | No server-side cache |
| **Rate Limit** | PostgreSQL-based | ⚠️ | No Redis |
| **Feature Flags** | DB table + React hook | ⚠️ | No Redis, no caching |
| **Payments** | Stripe (subscriptions + marketplace) | ✅ | Lazy init |
| **3D Vis** | react-three-fiber + drei | ✅ | Desktop + mobile fallback |
| **Testing** | Playwright (1 e2e test) + Vitest (config only) | ⚠️ | Minimal coverage |
| **CI/CD** | Vercel + Dockerfile | ✅ | Multi-stage Docker |

### Comparison with QuestHunt Architecture

| Feature | VG (Current) | QH (Reference) | Gap |
|---|---|---|---|
| **Redis** | ❌ None | ✅ Upstash (cache, flags, rate lim) | **Missing** |
| **AI Adapter** | ❌ None | ✅ Provider-agnostic layer | **Missing** |
| **AI Features** | Scaffold only | ✅ 10+ deployed features | **Major gap** |
| **TanStack Query** | ❌ SWR | ✅ TanStack Query | **Optional** |
| **TanStack Form** | ❌ react-hook-form | ✅ TanStack Form + Zod v4 | **Optional** |
| **Error Strategy** | Ad-hoc | ✅ Layered approach documented | **Missing** |
| **Rate Limiting** | Postgres-based | ✅ Redis-backed + overrides | **Inferior** |
| **Feature Flags** | DB-only | ✅ Redis + Redis chunked + DB sync | **Inferior** |
| **System Health** | ❌ None | ✅ Admin dashboard | **Missing** |
| **Audit Logging** | ❌ None | ✅ Activity tracking | **Partial** |
| **Email Notifications** | ❌ None | ✅ Resend + transactional | **Missing** |
| **PWA** | Basic manifest | ✅ Full offline support | **Partial** |
| **Testing** | 1 e2e test | ✅ Unit + e2e + visual | **Minimal** |

---

## §2 Security Assessment & Fixes

### Critical Issues

| # | Issue | Location | Severity | Mitigation |
|---|---|---|---|---|
| 1 | **Missing CSP header** | `next.config.mjs` | 🔴 Critical | Add Content-Security-Policy header |
| 2 | **Missing Permissions-Policy** | `next.config.mjs` | 🟡 Medium | Add permissions restrictions |
| 3 | **API config endpoint exposes env** | `app/api/config/route.ts` | 🔴 Critical | Gate with origin check, minimal exposure |
| 4 | **`typescript.ignoreBuildErrors: true`** | `next.config.mjs` | 🔴 Critical | Remove — blocks CI from catching type errors |
| 5 | **`images.unoptimized: true`** | `next.config.mjs` | 🟡 Medium | Remove — use Next.js Image optimization |
| 6 | **No CSRF protection on API routes** | All API routes | 🟡 Medium | Add origin/referer checking middleware |
| 7 | **Deprecated `X-XSS-Protection`** | `next.config.mjs` | 🟢 Low | Remove (modern browsers ignore it) |
| 8 | **No input sanitization** | Posts, messages, comments | 🟡 Medium | Add DOMPurify for user content |
| 9 | **No audit logging for sensitive ops** | Admin, auth, payments | 🟡 Medium | Add audit_log table + logging |
| 10 | **Rate limit stored in DB (no Redis)** | `lib/rate-limit.ts` | 🟡 Medium | Migrate rate limiting to Redis |

### Required Security Headers (to add)

```typescript
// Missing headers to add:
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; media-src 'self' https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com; frame-src 'self'; font-src 'self'"
},
{
  key: 'Permissions-Policy',
  value: 'camera=self, microphone=self, geolocation=self, interest-cohort=()'
},
{
  key: 'Cross-Origin-Opener-Policy',
  value: 'same-origin'
},
{
  key: 'Cross-Origin-Resource-Policy',
  value: 'same-origin'
}
```

---

## §3 Caching Architecture (Redis)

### Current State
- `lib/cache/storage.ts`: IndexedDB for client-side data + media caching
- `lib/cache/swr-config.ts`: SWR global config with TTL
- `lib/cache/hooks.ts`: Cached SWR hooks for profiles, posts, etc.
- `lib/cache/provider.tsx`: SWRConfig wrapper

### Identified Gaps

| Gap | Priority | Impact |
|---|---|---|
| **No server-side Redis cache** | 🔴 High | Every request hits Supabase directly. No shared cache across instances. |
| **Feature flags queried every render** | 🟡 Medium | No caching on `useFeatureFlag`. DB hit every mount. |
| **Rate limiting is DB-based** | 🟡 Medium | Slow. Can't handle burst traffic. No Redis atomic counters. |
| **No API response caching** | 🟡 Medium | Popular endpoints (discover, search) have no cache. |
| **No stale-while-revalidate at server** | 🟢 Low | Next.js `unstable_cache` not used for RSC data. |

### Redis Implementation Plan

```
┌─────────────────────────────────────────────────────┐
│                  Upstash Redis                       │
│                                                      │
│  ┌─────────────────┐  ┌─────────────────┐           │
│  │ Cache Layer     │  │ Rate Limiter    │           │
│  │ - API responses │  │ - Sliding window│           │
│  │ - Feature flags │  │ - Token bucket  │           │
│  │ - User sessions │  │ - Per-action    │           │
│  │ - AI responses  │  │   counters      │           │
│  └─────────────────┘  └─────────────────┘           │
│                                                      │
│  Key patterns:                                       │
│    vg:cache:<entity>:<id>        (TTL varies)        │
│    vg:ratelimit:<user>:<action>  (sliding window)   │
│    vg:flags:all                  (chunked if large)  │
│    vg:session:<token>            (auth cache)        │
└─────────────────────────────────────────────────────┘
```

---

## §4 Rate Limiting Architecture

### Current Implementation (`lib/rate-limit.ts`)
- PostgreSQL-based counting
- Inserts a row per request, counts via `select with count`
- Cleanup via manual `cleanupOldRateLimits()`
- No burst protection, no IP-based limiting

### Issues
1. **Performance**: Every request = 2 DB queries (select count + insert). Slow under load.
2. **No IP limiting**: Only user_id based. Anonymous users unprotected.
3. **No sliding window accuracy**: Simple `WHERE created_at > windowStart` is a fixed window, subject to burst at boundary.
4. **No global rate limits**: Per-user only. No global platform limits.
5. **No Redis**: Can't scale horizontally without shared state.

### Redis-Based Rate Limiting Plan

```typescript
// lib/redis/rate-limit.ts (new)
// Using Upstash Redis @upstash/ratelimit

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Sliding window rate limiters
export const rateLimiters = {
  post_create: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 per minute
    analytics: true,
    prefix: "vg:rl:post_create",
  }),
  comment_create: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    prefix: "vg:rl:comment_create",
  }),
  message_send: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "vg:rl:message_send",
  }),
  // ... etc
};
```

---

## §5 AI Features Assessment & Plan

### Current State
- `app/actions/recommendations.ts`: Basic content recommendations (not AI-powered)
- `sql/feature-flags.sql`: `ai_recommendations` flag seeded
- `hooks/use-feature-flag.ts`: Supports flag checking
- **No AI provider integration exists**
- **No AI adapter layer**
- **No AI API routes**

### Comparison with QuestHunt AI Features

| QH AI Feature | VG Equivalent | Status | Priority |
|---|---|---|---|
| `ai_quest_generation` | `ai_post_generation` / `ai_content_assist` | ❌ Not implemented | 🔴 High |
| `ai_companion_dialogue` | `ai_chat_assistant` / `ai_social_coach` | ❌ Not implemented | 🟡 Medium |
| `ai_hint_generation` | `ai_content_suggestions` / `ai_tag_suggestions` | ❌ Not implemented | 🟡 Medium |
| `ai_puzzle_generation` | `ai_group_activity_generator` / `ai_event_planner` | ❌ Not implemented | 🟢 Low |
| `ai_content_moderation` | `ai_content_moderation` (NSFW detection) | ❌ Not implemented | 🔴 High |
| `ai_translation_assist` | `ai_translation` (EN↔FR bilingual req) | ❌ Not implemented | 🔴 High |
| `ai_photo_validation` | `ai_media_validation` (EXIF, CSAM detection) | ❌ Not implemented | 🟡 Medium |
| `ai_daily_quests` | `ai_daily_feed_curation` | ❌ Not implemented | 🟡 Medium |
| `ai_quest_recommendations` | `ai_content_recommendations` / `ai_people_you_may_know` | ⚠️ Scaffold only | 🟡 Medium |
| `ai_quest_builder_assistant` | `ai_post_composer_assistant` | ❌ Not implemented | 🟢 Low |
| `ai_edu_quests` | `ai_onboarding_assistant` | ❌ Not implemented | 🟢 Low |

### AI Feature Implementation Plan

#### Phase 1: Foundation (Week 1)
1. **AI Adapter Layer** (`lib/ai/`)
   - `lib/ai/types.ts` — Common types (AiProvider, AiModel, AiResponse, etc.)
   - `lib/ai/adapter.ts` — Provider-agnostic adapter interface
   - `lib/ai/deepseek-adapter.ts` — DeepSeek V4 adapter (primary, cheapest)
   - `lib/ai/factory.ts` — Provider factory with fallback
   - `lib/ai/rate-limiter.ts` — Per-user, per-feature rate limits
   - `lib/ai/cache.ts` — Redis-backed response caching with TTL

2. **Feature Flags** (add to `sql/feature-flags.sql` seed)
   - `ai_content_moderation` — AI-powered NSFW/content policy detection
   - `ai_translation_assist` — AI-assisted EN↔FR translation
   - `ai_content_recommendations` — AI-powered feed curation
   - `ai_post_composer` — AI writing assistant for posts
   - `ai_tag_suggestions` — AI tag suggestions for posts/profiles
   - `ai_chat_assistant` — AI companion for social coaching
   - `ai_media_caption` — AI image/video captioning
   - `ai_onboarding_assistant` — AI-guided onboarding
   - `ai_group_activity` — AI event/activity suggestions for groups

3. **Admin AI Settings Page** (`app/admin/ai/page.tsx`)
   - Model selection (DeepSeek V4 Flash/Pro)
   - Per-feature enable/disable
   - Rate limit configuration
   - Cost tracking dashboard
   - Cache settings

#### Phase 2: Content Moderation (Week 1-2)
- `app/api/ai/moderate/route.ts` — Content moderation endpoint
- Integration with post creation, message sending, media upload
- SFW/NSFW auto-classification
- Report triage assistance

#### Phase 3: Translation (Week 2)
- `app/api/ai/translate/route.ts` — Translation endpoint
- EN↔FR bilingual support (AGENTS.md requirement)
- Integration with post composer, messaging, UI
- Batch translation for feed

#### Phase 4: Recommendations (Week 2-3)
- `app/api/ai/recommend/route.ts` — Content/people recommendations
- Feed personalization engine
- "People You May Know" social graph analysis
- Discovery hub AI curation

#### Phase 5: Composition Assistant (Week 3)
- `app/api/ai/compose/route.ts` — Writing assistant
- Post enhancement suggestions
- Tag generation
- Media captioning
- Onboarding assistant

### Cost-Efficiency Techniques (from QH Reference)

| Technique | Implementation | Savings |
|---|---|---|
| **Redis Caching** | Cache AI responses by prompt hash + model | 60-80% |
| **Semantic Dedup** | Hash prompts, skip identical requests | 30-40% |
| **Tiered Rate Limits** | Free: 5/day, Basic: 20/day, Premium: 100/day | Predictable cost |
| **Model Tiering** | DeepSeek V4 Flash for simple tasks, Pro for complex | 3x cost diff |
| **Batch Processing** | Queue non-urgent requests, process in batch windows | 20-30% |
| **Response Reuse** | Cache common moderation results, translations | 50%+ |
| **User Cooldowns** | Prevent rapid re-requests of same feature | 10-20% |
| **Cost Tracking** | Per-user, per-feature cost attribution | Visibility |
| **Admin Override** | Admins bypass rate limits, costs tracked separately | — |

### AI Cost Projections (VG scale)

| User Tier | AI Features / User / Mo | Est. API Cost / User / Mo |
|---|---|---|
| **Free** | 5 mod + 2 trans + 5 recs | $0.08 |
| **Basic ($4.99/mo)** | 20 mod + 10 trans + 15 recs + 5 compose | $0.35 |
| **Premium ($9.99/mo)** | 100 mod + 50 trans + 50 recs + 20 compose | $1.20 |

At 1,000 users (10% Basic, 5% Premium): **~$84/month** total AI costs.
At 10,000 users: **~$840/month** total AI costs.

---

## §6 Neo4J Integration Assessment

### Conclusion: YES — Neo4J is pertinent and makes strong technical sense for VG

**Rationale:** VG's social graph IS the product. The custom relationship system (Dom/Sub, Partner, mutual consent), the 3D galaxy network visualization, and the interconnections between profiles, groups, events, and artists all form a genuine property graph.

### What Neo4J Would Handle

| Feature | Current (Supabase) | With Neo4J |
|---|---|---|
| **"Friends of friends who liked X"** | Multiple recursive CTEs or multiple round-trips | Single Cypher query |
| **3D Galaxy Visualization** | Manual JOIN + in-memory graph building | Native graph traversal |
| **Custom Relationship Types** | Stored in relational tables, assembled manually | Native relationship properties |
| **Community Detection** | Not feasible at scale | Built-in algorithms (Louvain, Label Propagation) |
| **Recommendation Engine** | Manual similarity calculations | Graph-native collaborative filtering |
| **Path Finding** | Recursive CTE pain | `shortestPath()` built-in |

### Recommended Architecture: Supabase + Neo4j Hybrid

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 (Vercel)                   │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │  Supabase SDK    │  │  Neo4j Driver    │            │
│  │  - Auth          │  │  - Social Graph  │            │
│  │  - Content CRUD  │  │  - Galaxy Viz    │            │
│  │  - Storage       │  │  - Path Finding  │            │
│  │  - Realtime      │  │  - Community     │            │
│  │  - Marketplace   │  │  - Recommend.    │            │
│  └────────┬─────────┘  └────────┬─────────┘            │
└───────────┼─────────────────────┼──────────────────────┘
            │                     │
   ┌────────┴────────┐   ┌────────┴────────┐
   │   Supabase      │   │  Neo4j AuraDB   │
   │  - Auth         │   │  - Profiles     │
   │  - Posts/Msgs   │   │  - Relationships│
   │  - Media        │   │  - Groups/Events│
   │  - Marketplace  │   │  - Artists      │
   │  - RLS          │   │  - Graph Viz    │
   │  - 60+ tables   │   │  - Cypher       │
   └─────────────────┘   └─────────────────┘
```

### Sync Strategy

```typescript
// lib/neo4j/sync.ts (new)
// When Supabase data changes, sync to Neo4j eventually

// On profile creation → CREATE (:Profile) node
// On relationship change → CREATE/MERGE (:Profile)-[:FOLLOWS|FRIENDS|DOM_SUB]->(:Profile)
// On group membership → CREATE (:Profile)-[:MEMBER_OF]->(:Group)
// On event RSVP → CREATE (:Profile)-[:ATTENDING]->(:Event)
// On artwork creation → CREATE (:Artist)-[:CREATED]->(:Artwork)

// Use Supabase Database Webhooks or Realtime to trigger sync
```

### Feature Flag Gating

```sql
-- Add to feature_flags
INSERT INTO public.feature_flags (name, description, is_enabled, config) VALUES
('neo4j_graph_queries', 'Neo4j-backed social graph queries for galaxy visualization and recommendations', false, '{"tier": "premium"}'),
('neo4j_community_detection', 'Neo4j community detection algorithms for discovery', false, '{"tier": "premium"}'),
('neo4j_recommendations', 'Neo4j-powered friend and content recommendations', false, '{"tier": "premium"}');
```

### Neo4J Migration Path

| Step | Effort | Description |
|---|---|---|
| 1. Set up Neo4j AuraDB Free tier | 15 min | 50K nodes, 175K rels free |
| 2. Define graph model | 1 day | Nodes: Profile, Group, Event, Artwork. Relationships: FOLLOWS, FRIENDS, etc. |
| 3. Build sync layer | 2-3 days | Supabase DB hooks → Neo4j upserts |
| 4. Implement graph queries | 3-5 days | Galaxy viz, recommendations, path finding |
| 5. Feature flag integration | 1 day | Gated behind `neo4j_graph_queries` |
| 6. Migration of existing data | 1 day | Batch import of 60+ tables to graph |
| **Total** | **~2 weeks** | **Parallel work, doesn't block Supabase** |

---

## §7 Error Handling Strategy

### Current State
- Ad-hoc error handling (try/catch + console.error)
- No error boundaries in component tree
- No centralized error logging
- No user-friendly error classification
- SWR `onError` callback only logs to console
- Server actions return `{error: string}` objects (inconsistent)

### Required Implementation (QH Reference)

#### Error Boundary Hierarchy
```
RootLayout
  ├── <ErrorBoundary fallback={GlobalError}>
  │   ├── <ErrorBoundary fallback={FeedError}>
  │   │   └── Feed page
  │   ├── <ErrorBoundary fallback={ProfileError}>
  │   │   └── Profile page
  │   └── <ErrorBoundary fallback={NetworkError}>
  │       └── Network viz
```

#### Error Classification
```typescript
// lib/errors.ts (new)
export enum ErrorType {
  NETWORK = "NETWORK",
  AUTH = "AUTH",
  PERMISSION = "PERMISSION",
  VALIDATION = "VALIDATION",
  RATE_LIMIT = "RATE_LIMIT",
  NOT_FOUND = "NOT_FOUND",
  SERVER = "SERVER",
}

export interface AppError {
  type: ErrorType;
  code: string;
  message: string;      // User-facing
  detail?: string;      // Developer-facing (not shown to user)
  retry?: boolean;      // Can user retry?
  statusCode?: number;
}
```

#### User Feedback Layering
1. **Inline validation** — Form field errors (closest to action)
2. **Toast notifications** — Action success/failure feedback
3. **Error boundary fallbacks** — Component-level recovery
4. **Global error page** — Catastrophic failures

---

## §8 TanStack Query Migration (Optional Enhancement)

### SWR vs TanStack Query Comparison

| Feature | SWR (Current) | TanStack Query | Gap |
|---|---|---|---|
| **Data fetching** | ✅ | ✅ | — |
| **Caching** | ✅ | ✅ | — |
| **Mutations** | ❌ No built-in | ✅ `useMutation` | **Missing** |
| **Optimistic updates** | ❌ Manual | ✅ Built-in | **Missing** |
| **Infinite queries** | ❌ Manual (own hook) | ✅ `useInfiniteQuery` | **Partial** |
| **Query invalidation** | ✅ `mutate()` | ✅ `queryClient.invalidateQueries()` | — |
| **DevTools** | ❌ None | ✅ React Query DevTools | **Missing** |
| **Prefetching** | ❌ Manual | ✅ `queryClient.prefetchQuery()` | **Partial** |
| **Garbage collection** | ✅ | ✅ | — |
| **Bundle size** | ~5KB | ~12KB | — |

### Recommendation
VG currently uses SWR effectively with a custom IndexedDB caching layer. Moving to TanStack Query would add mutation management and optimistic updates but requires significant migration. **Recommended as an enhancement, not urgent.**

If migrating, follow QH's TanStack Query guidelines at `docs/technical/tanstack-query-guidelines.md`.

---

## §9 UI/UX Feedback Improvements

### Current Gaps (from QH Reference)

| Pattern | QH | VG | Gap |
|---|---|---|---|
| **Loading skeletons** | ✅ Route-level + component | ⚠️ Few loading.tsx files | **Partial** |
| **Empty states** | ✅ Illustrated, actionable | ⚠️ Inconsistent | **Missing** |
| **Error states** | ✅ Layered approach | ❌ Ad-hoc | **Missing** |
| **Optimistic UI** | ✅ Like/unlike, follow/unfollow | ❌ None | **Missing** |
| **Toast feedback** | ✅ sonner, categorized | ✅ sonner (installed) | — |
| **Navigation feedback** | ✅ Active link highlight | ✅ Active colors | — |
| **Form validation** | ✅ Zod + TanStack Form | ✅ react-hook-form + zod | — |
| **Destructive confirmations** | ✅ Alert dialogs | ⚠️ Inconsistent | **Partial** |
| **Scroll cues** | ✅ For infinite scroll | ❌ None | **Missing** |
| **Offline feedback** | ✅ PWA offline page | ✅ offline/page.tsx | — |

### Required Additions
1. **Optimistic update pattern** for likes, follows, bookmarks
2. **Skeleton loaders** for all dynamic routes
3. **Empty state components** with CTAs
4. **Error boundary components** with retry buttons
5. **Loading progress** for uploads and AI operations

---

## §10 System Health & Monitoring

### Missing Features

| Feature | Priority | Description |
|---|---|---|
| **Admin health dashboard** | 🟡 Medium | Uptime, DB latency, error rates, Redis health |
| **Audit logging** | 🟡 Medium | Track admin actions, auth events, moderation |
| **Email notifications** | 🟡 Medium | Security events (MFA changes, suspicious device) |
| **Error tracking** | 🟢 Low | Sentry or custom error aggregation |
| **Performance monitoring** | 🟢 Low | Web Vitals, API latency tracking |

### Audit Log Table

```sql
CREATE TABLE public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,           -- e.g., 'post.delete', 'user.ban', 'flag.toggle'
  target_type TEXT,               -- e.g., 'post', 'user', 'feature_flag'
  target_id UUID,
  metadata JSONB DEFAULT '{}',    -- Additional context
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## §11 Library Version & CVE Assessment

### Current Dependencies (from package.json)

| Package | Current | Latest | Status |
|---|---|---|---|
| `next` | ^16.1.1 | 16.1.1 | ✅ Current |
| `react` | ^19.2.3 | 19.2.3 | ✅ Current |
| `@supabase/supabase-js` | ^2.90.1 | 2.90.1 | ✅ Current |
| `@supabase/ssr` | ^0.8.0 | 0.8.0 | ✅ Current |
| `stripe` | ^20.1.2 | Check | ⚠️ Verify |
| `@stripe/react-stripe-js` | ^5.4.1 | Check | ⚠️ Verify |
| `three` (via fiber/drei) | — | — | ⚠️ Verify |
| `zod` | ^4.3.5 | 4.3.5 | ✅ Current |
| `tailwindcss` | ^4.1.18 | 4.1.18 | ✅ Current |
| `typescript` | ^5.9.3 | 5.9.3 | ✅ Current |
| `eslint` | ^9.39.2 | 9.39.2 | ✅ Current |
| `vite` | ^7.3.1 | 7.3.1 | ✅ Current |
| `vitest` | ^4.0.16 | 4.0.16 | ✅ Current |
| `playwright` | ^1.57.0 | 1.57.0 | ✅ Current |
| `swr` | ^2.3.8 | 2.3.8 | ✅ Current |

### Known CVEs to Address

| CVE | Package | Status | Action |
|---|---|---|---|
| CVE-2025-66478 | Next.js RSC | ✅ Patched (16.0.10+) | Upgraded to 16.1.1 |
| CVE-2025-55182 | Next.js RSC | ✅ Patched (16.0.10+) | Upgraded to 16.1.1 |
| — | `@supabase/supabase-js` | ✅ Current | — |
| — | `stripe` | ⚠️ Check | Run `npm audit` |
| — | `react-three-fiber` | ⚠️ Check | Run `npm audit` |

### Actions
1. Run `pnpm audit` to identify remaining vulnerabilities
2. Run `pnpm update --latest` for all non-breaking updates
3. Check for any transitive dependency issues
4. Test after upgrades

---

## §12 Documentation Gaps

### Current Documentation
| File | Status | Notes |
|---|---|---|
| `AGENTS.md` | ✅ Good | 104 lines, comprehensive rules |
| `action-plan.md` | ⚠️ Outdated | Marked everything Complete, no Next items |
| `README.md` | ✅ Good | Architecture, setup, deploy docs |
| `IMPLEMENTATION_COMPLETE.md` | ⚠️ Stale | Last updated for network viz features |
| `REMAINING_TASKS.md` | ⚠️ Stale | Tasks already completed |
| `MIGRATION_GUIDE.md` | ⚠️ Needs update | — |
| `ARTISTS_SHOWCASE_IMPLEMENTATION.md` | ✅ Good | — |
| `docs/ARTIST_ARCHITECTURE.md` | ✅ Good | 656 lines |
| `docs/vercel-ci-guardrails.md` | ✅ Good | — |

### Required New Documentation
1. ✅ `docs/gap-analysis-implementation-roadmap.md` — **This document**
2. `docs/neo4j-integration-plan.md` — Neo4J architecture and migration
3. `docs/ai-features-implementation-plan.md` — AI features, caching, costs
4. `docs/security-hardening-guide.md` — Security headers, CSRF, input sanitization
5. `docs/redis-caching-architecture.md` — Redis cache layer design
6. `docs/error-handling-strategy.md` — Error boundaries, user feedback
7. `docs/tanstack-migration-guide.md` — SWR to TanStack Query migration (if pursued)

---

## §13 Implementation Priority Matrix

### Phase 1: Security & Stability (This Week)
| Priority | Task | Effort | Section |
|---|---|---|---|
| 🔴 P0 | Fix security headers (CSP, COOP, CORP, Permissions-Policy) | 2h | §2 |
| 🔴 P0 | Remove `typescript.ignoreBuildErrors: true` | 15min | §2 |
| 🔴 P0 | Remove `images.unoptimized: true` | 15min | §2 |
| 🔴 P0 | Secure API config endpoint | 30min | §2 |
| 🔴 P1 | Add Redis caching layer (`lib/redis/`) | 4h | §3 |
| 🔴 P1 | Migrate rate limiting to Redis | 3h | §4 |
| 🔴 P1 | Run dependency audit and upgrades | 1h | §11 |

### Phase 2: Feature Foundation (Next Week)
| Priority | Task | Effort | Section |
|---|---|---|---|
| 🟡 P1 | AI adapter layer (`lib/ai/`) | 4h | §5 |
| 🟡 P1 | AI content moderation feature | 4h | §5 |
| 🟡 P1 | AI translation feature (EN↔FR) | 3h | §5 |
| 🟡 P1 | Feature flag extensions for AI and Neo4j | 2h | §5, §6 |
| 🟡 P1 | Error handling strategy implementation | 4h | §7 |
| 🟡 P2 | System health monitoring dashboard | 4h | §10 |
| 🟡 P2 | Audit logging table + triggers | 2h | §10 |

### Phase 3: Enhancements (Ongoing)
| Priority | Task | Effort | Section |
|---|---|---|---|
| 🔵 P2 | Neo4j integration (feature-gated) | 2 weeks | §6 |
| 🟢 P3 | AI recommendations engine | 1 week | §5 |
| 🟢 P3 | AI composition assistant | 1 week | §5 |
| 🟢 P3 | TanStack Query migration (optional) | 1 week | §8 |
| 🟢 P3 | UI/UX feedback improvements | 3 days | §9 |
| 🟢 P3 | Email notification system | 2 days | §10 |

---

## §14 Legend

| Symbol | Meaning |
|---|---|
| ✅ | Complete / Good |
| ⚠️ | Needs work / Partial |
| ❌ | Missing / Not started |
| 🔜 | Planned |
| 🔴 Critical | Must fix for security/stability |
| 🟡 Medium | Important feature gap |
| 🟢 Low | Nice to have, optional |
| 🔵 Optional | Enhancement, not blocking |

---

*This document is the single source of truth for VG gap analysis. Updated 2026-05-15.*

# AI Features Implementation Plan — Velvet Galaxy

> May 15, 2026 — AI feature roadmap with caching, cost-efficiency, and QH reference architecture

---

## Overview

Velvet Galaxy's AI features leverage DeepSeek's provider-agnostic adapter layer, Redis caching, tiered rate limiting, and feature flags — modeled on QuestHunt's proven AI architecture. All AI features are **server-side only**, **provider-agnostic**, **cost-tracked**, and **feature-flag gated**.

---

## Architecture

```
Browser (Client Component)
│
├─ POST /api/ai/moderate?content=...     ────► AI Adapter Layer
├─ POST /api/ai/translate?content=...     ────► lib/ai/
├─ POST /api/ai/compose?prompt=...        ────► lib/ai/
└─ POST /api/ai/tags?content=...          ────► lib/ai/
                                                  │
                                                  ├─ Redis Cache (vg:cache:ai:*)
                                                  │  ├─ Prompt hash → Response (TTL: 1h)
                                                  │  └─ Semantic dedup
                                                  │
                                                  ├─ Rate Limiter (vg:rl:ai_request:*)
                                                  │  └─ Sliding window per user
                                                  │
                                                  └─ DeepSeek API
                                                     ├─ deepseek-v4-flash (primary, cheap)
                                                     └─ deepseek-v4-pro (complex tasks)
```

---

## AI Features by Priority

### Phase 1: Foundation (Current Week)

| Feature | Flag | Model | Description |
|---|---|---|---|
| **AI Content Moderation** | `ai_content_moderation` | Flash | Auto-detect hate speech, harassment, spam, untagged NSFW |
| **AI Translation (EN↔FR)** | `ai_translation_assist` | Flash | Translate posts, messages, UI (bilingual requirement) |
| **AI Post Composer** | `ai_post_composer` | Flash | Writing assistant for post content with style guide |
| **AI Tag Suggestions** | `ai_tag_suggestions` | Flash | Auto-generate relevant tags from post content |

### Phase 2: Recommendations (Week 2-3)

| Feature | Flag | Model | Description |
|---|---|---|---|
| **AI Content Recommendations** | `ai_content_recommendations` | Flash | Personalized feed curation based on interests and engagement |
| **AI People Discovery** | `ai_people_discovery` | Pro | Graph-based "People You May Know" analysis |
| **AI Media Captioning** | `ai_media_caption` | Flash | Generate captions for uploaded images/videos |

### Phase 3: Social Features (Week 3-4)

| Feature | Flag | Model | Description |
|---|---|---|---|
| **AI Chat Assistant** | `ai_chat_assistant` | Flash | Social coaching tips, ice-breaker suggestions |
| **AI Onboarding Assistant** | `ai_onboarding_assistant` | Flash | Guide new users through profile setup, tag selection |
| **AI Group Activity Generator** | `ai_group_activity` | Pro | Suggest activities/discussions for groups based on interests |
| **AI Event Planner** | `ai_event_planner` | Flash | Generate event descriptions, schedules, and promotion copy |

---

## Cost-Efficiency Techniques

### 1. Redis Response Caching

```
Key pattern: vg:cache:ai:deepseek:{model}:{prompt_hash}
TTL: 1 hour for content queries, 24 hours for translations
```

| Technique | How | Savings |
|---|---|---|
| **Identical prompt dedup** | Hash prompt + model → check Redis before API call | 60-80% |
| **Translation caching** | Hash original text + target language | 50-70% |
| **Moderation caching** | Hash content fingerprint → reuse result for similar content | 40-60% |
| **Semantic similarity** | Use content embedding similarity for "near-match" reuse | 20-30% |

### 2. Tiered Rate Limiting

| Tier | AI Requests / Day | Features Allowed |
|---|---|---|
| **Free** | 5 moderation + 2 translation + 3 composer | Basic moderation, occasional translation |
| **Basic ($4.99/mo)** | 20 moderation + 10 translation + 10 composer + 5 recommendations | Full AI features at moderate usage |
| **Premium ($9.99/mo)** | 100 moderation + 50 translation + 30 composer + 20 recommendations | Heavy AI usage, priority |
| **Admin** | Unlimited (cost-tracked separately) | All features |

### 3. Model Selection by Complexity

| Task Complexity | Model | Cost per 1M tokens | When |
|---|---|---|---|
| **Simple** (moderation, tags, translation) | `deepseek-v4-flash` | $0.14 input / $0.28 output | Default |
| **Complex** (recommendations, discovery, activity gen) | `deepseek-v4-pro` | $0.55 input / $1.10 output | Feature-flagged premium |

### 4. Batch Processing

Non-urgent AI requests (daily feed curation, batch moderation) are queued and processed during low-traffic windows to minimize concurrent API calls and improve caching efficiency.

### 5. Cost Tracking

Every AI request is logged with:
```typescript
interface AiCostRecord {
    userId: string;
    feature: AiFeature;
    model: AiModel;
    tokensUsed: number;
    estimatedCost: number; // In USD, calculated from token counts
    cached: boolean;        // Was this served from cache?
    timestamp: number;
}
```

Admin dashboard shows:
- Total AI cost per day/week/month
- Cost per user / per feature / per model
- Cache hit rate
- Rate limit breaches

---

## Feature Flag Configuration

```sql
-- Seed AI feature flags
INSERT INTO public.feature_flags (name, description, is_enabled, config) VALUES
('ai_content_moderation', 'AI-powered content moderation for posts, messages, and comments', false, '{
    "model": "deepseek-v4-flash",
    "maxTokens": 256,
    "temperature": 0.1,
    "cacheTtlMs": 3600000,
    "tierLimits": {"free": 5, "basic": 20, "premium": 100, "admin": -1}
}'),
('ai_translation_assist', 'AI-assisted EN↔FR translation for posts and messages', false, '{
    "model": "deepseek-v4-flash",
    "maxTokens": 2048,
    "temperature": 0.3,
    "cacheTtlMs": 86400000,
    "tierLimits": {"free": 2, "basic": 10, "premium": 50, "admin": -1}
}'),
('ai_post_composer', 'AI writing assistant for creating post content', false, '{
    "model": "deepseek-v4-flash",
    "maxTokens": 500,
    "temperature": 0.8,
    "cacheTtlMs": 600000,
    "tierLimits": {"free": 3, "basic": 10, "premium": 30, "admin": -1}
}'),
('ai_tag_suggestions', 'AI auto-suggest tags from post content', false, '{
    "model": "deepseek-v4-flash",
    "maxTokens": 200,
    "temperature": 0.5,
    "cacheTtlMs": 3600000,
    "tierLimits": {"free": 5, "basic": 20, "premium": 50, "admin": -1}
}'),
('ai_content_recommendations', 'AI-powered personalized feed and content recommendations', false, '{
    "model": "deepseek-v4-pro",
    "maxTokens": 1024,
    "temperature": 0.7,
    "cacheTtlMs": 1800000,
    "tierLimits": {"free": 0, "basic": 5, "premium": 20, "admin": -1}
}'),
('ai_people_discovery', 'AI-powered "People You May Know" social graph recommendations', false, '{
    "model": "deepseek-v4-pro",
    "maxTokens": 512,
    "temperature": 0.6,
    "cacheTtlMs": 7200000,
    "tierLimits": {"free": 0, "basic": 5, "premium": 15, "admin": -1}
}'),
('ai_media_caption', 'AI-generated captions for uploaded images and videos', false, '{
    "model": "deepseek-v4-flash",
    "maxTokens": 200,
    "temperature": 0.7,
    "cacheTtlMs": 7200000,
    "tierLimits": {"free": 2, "basic": 10, "premium": 30, "admin": -1}
}'),
('ai_chat_assistant', 'AI social coaching and conversation suggestions', false, '{
    "model": "deepseek-v4-flash",
    "maxTokens": 512,
    "temperature": 0.8,
    "cacheTtlMs": 600000,
    "tierLimits": {"free": 0, "basic": 5, "premium": 20, "admin": -1}
}'),
('ai_onboarding_assistant', 'AI-guided new user onboarding and profile setup', false, '{
    "model": "deepseek-v4-flash",
    "maxTokens": 1024,
    "temperature": 0.7,
    "cacheTtlMs": 3600000,
    "tierLimits": {"free": 1, "basic": 3, "premium": 10, "admin": -1}
}'),
('ai_group_activity', 'AI activity and event suggestion generator for groups', false, '{
    "model": "deepseek-v4-pro",
    "maxTokens": 1024,
    "temperature": 0.8,
    "cacheTtlMs": 3600000,
    "tierLimits": {"free": 0, "basic": 3, "premium": 15, "admin": -1}
}');
```

---

## QuestHunt Reference Architecture

VG's AI architecture is directly inspired by QuestHunt's proven patterns:

| QH Pattern | VG Implementation | Status |
|---|---|---|
| `lib/ai/types.ts` — Common types | `lib/ai/types.ts` | ✅ Implemented |
| `lib/ai/adapter.ts` — Provider-agnostic interface | `lib/ai/deepseek-adapter.ts` | ✅ Implemented |
| `lib/ai/factory.ts` — Provider factory | `lib/ai/factory.ts` | ✅ Implemented |
| `lib/security/rate-limit.ts` — Redis rate limiting | `lib/redis/rate-limit.ts` | ✅ Implemented |
| `lib/cache.ts` — Redis caching | `lib/redis/cache.ts` | ✅ Implemented |
| `docs/technical/deepseek-ai-integration-guide.md` | **This document** | ✅ Created |
| `docs/technical/ai-tier-gating-strategy.md` | Tier limits in feature flag config | ✅ Configured |
| `docs/technical/admin-ai-assistance-implementation.md` | `app/admin/ai/page.tsx` (to build) | 🔜 Phase 2 |
| `docs/technical/ai-user-restrictions.md` | Server-side tier limits in API routes | ✅ Implemented |
| Feature flags gating all AI | `sql/feature-flags.sql` seed | 🔜 Add seed |
| Admin cost tracking dashboard | `app/admin/ai/` page | 🔜 Phase 2 |
| Cost projection tool | QH-style cost projections | ✅ Documented above |

---

## Security & Privacy

| Principle | Implementation |
|---|---|
| **API keys server-only** | `DEEPSEEK_API_KEY` in `.env`, never exposed to client |
| **User data minimization** | Only send necessary content (truncated at 5000 chars max) |
| **No training opt-out** | DeepSeek API doesn't train on user data by default |
| **NSFW content handling** | Moderation model explicitly trained to allow NSFW with proper tagging |
| **Rate limiting** | Per-user, per-feature sliding windows via Redis |
| **Audit logging** | All AI requests logged with user, feature, cost, and response status |

---

## Cost Projections

### Per-Request Costs (DeepSeek V4)

| Feature | Model | Avg Tokens | Cost/Request |
|---|---|---|---|
| Content Moderation | Flash | 300 | $0.00005 |
| Translation (short) | Flash | 800 | $0.00012 |
| Translation (long) | Flash | 3000 | $0.00050 |
| Post Composer | Flash | 800 | $0.00012 |
| Tag Suggestions | Flash | 300 | $0.00005 |
| Recommendations | Pro | 1500 | $0.00075 |
| People Discovery | Pro | 1000 | $0.00050 |
| Chat Assistant | Flash | 800 | $0.00012 |

### Monthly Cost by Scale (with 60% cache hit rate)

| Users | Free (5%) | Basic (10%) | Premium (5%) | Monthly Cost |
|---|---|---|---|---|
| 100 | 5 | 10 | 5 | **~$8** |
| 1,000 | 50 | 100 | 50 | **~$84** |
| 10,000 | 500 | 1,000 | 500 | **~$840** |
| 100,000 | 5,000 | 10,000 | 5,000 | **~$8,400** |

---

## Implementation Status

| Feature | API Route | Adapter Function | Flag | Status |
|---|---|---|---|---|
| Content Moderation | `app/api/ai/moderate/route.ts` | `aiModerate()` | `ai_content_moderation` | ✅ Implemented |
| Translation | `app/api/ai/translate/route.ts` | `aiTranslate()` | `ai_translation_assist` | ✅ Implemented |
| Post Composer | `app/api/ai/compose/route.ts` | `aiCompose()` | `ai_post_composer` | ✅ Implemented |
| Tag Suggestions | `app/api/ai/tags/route.ts` | `aiSuggestTags()` | `ai_tag_suggestions` | ✅ Implemented |
| Content Recommendations | 🔜 | 🔜 | `ai_content_recommendations` | 🟡 Planned |
| People Discovery | 🔜 | 🔜 | `ai_people_discovery` | 🟡 Planned |
| Media Captioning | 🔜 | 🔜 | `ai_media_caption` | 🟡 Planned |
| Chat Assistant | 🔜 | 🔜 | `ai_chat_assistant` | 🟡 Planned |
| Onboarding Assistant | 🔜 | 🔜 | `ai_onboarding_assistant` | 🟡 Planned |
| Group Activity | 🔜 | 🔜 | `ai_group_activity` | 🟡 Planned |

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Implemented and ready for testing |
| 🟡 | Planned, not yet implemented |
| 🔜 | Next phase |
| ❌ | Not started |

---

*See also: `docs/gap-analysis-implementation-roadmap.md` §5, `docs/neo4j-integration-plan.md`*

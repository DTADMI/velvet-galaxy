# Velvet Galaxy — Documentation

> **Owner**: Nebula Forge Digital Studio  
> **Last Updated**: 2026-08-20  

## Overview

Velvet Galaxy is a social network and creative marketplace for artists, musicians, and creators. Next.js 16 App Router on Vercel with Supabase (Auth, DB, Storage, Realtime), Stripe payments, Upstash Redis, and Neo4j graph database for social connections.

## Quick Links

| Document | Content |
|---|---|
| [Action Plan](action-plan.md) | Gap tracking, priorities, roadmap |
| [Artist Architecture](ARTIST_ARCHITECTURE.md) | Artist profile, portfolio, and gallery design |
| [AI Features Plan](ai-features-implementation-plan.md) | AI integration strategy |
| [Neo4j Integration](neo4j-integration-plan.md) | Graph database for social connections |
| [Gap Analysis](gap-analysis-implementation-roadmap.md) | Detailed implementation roadmap |
| [TanStack Migration](tanstack-migration-guide.md) | Query/mutation migration guide |
| [Vercel Guardrails](vercel-ci-guardrails.md) | CI/CD skip rules and deployment |
| [Technical Docs](technical/) | Performance, encoding, i18n |

## Architecture

```
velvet-galaxy/
├── app/                    ← Next.js 16 App Router (40+ pages)
│   ├── (auth)/             ← Sign in, sign up, onboarding
│   ├── (main)/             ← Feed, profile, messages, marketplace, media, search
│   ├── (admin)/            ← Admin dashboard, moderation, analytics
│   └── api/                ← API routes
├── components/             ← 80+ UI components
│   ├── ui/                 ← Design system primitives
│   └── portal/             ← Portal/overlay components
├── hooks/                  ← Custom hooks (feature flags, infinite scroll, mobile, TTS)
├── lib/                    ← Core logic
│   ├── feature-flags.ts    ← 21 feature flags (Redis + DB-backed)
│   ├── stripe.ts           ← Subscription + marketplace payments
│   ├── neo4j/              ← Graph database connection + queries
│   ├── ai/                 ← AI feature adapters
│   ├── supabase/           ← Supabase client helpers
│   └── i18n/               ← React Context i18n (config, server, provider, EN/FR)
├── sql/                    ← SQL (schema, seed, feature flags, marketplace)
├── tests/                  ← E2E + unit tests
└── docs/                   ← Technical documentation
```

## Feature Flags

21 feature flags defined in `libfile:///feature-flags.ts`, Redis + DB-backed. Flags control: payments, AI features, marketplace, events, groups, notifications, media upload, and experimental features.

## Getting Started

```bash
pnpm install
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm type-check       # TypeScript check
pnpm test             # Test suite
pnpm test:e2e         # Playwright E2E
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Cache | Upstash Redis |
| Graph | Neo4j (social connections, recommendations) |
| Payments | Stripe (subscriptions + marketplace) |
| Realtime | Supabase Realtime (chat, notifications) |
| Storage | Supabase Storage (media, uploads) |
| Email | Resend |
| PWA | Service worker + offline support |
| Hosting | Vercel |

---

*Document maintained by Nebula Forge Digital Studio — August 2026*
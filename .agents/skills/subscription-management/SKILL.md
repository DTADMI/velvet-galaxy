---
name: subscription-management
description: Manage Velvet Galaxy subscription tiers, Stripe webhooks, access gating, and plan lifecycle. Use when a task touches subscription plans, pricing, checkout flow, subscription status checks, or gated feature access.
---

# Subscription Management

Use this skill for subscription and monetization work.

## Workflow

1. Identify the subscription surface: tier definition, checkout flow, webhook handling, access gating, or plan management.
2. Follow Stripe integration patterns: use server-side helpers from `lib/stripe.ts` and `lib/subscription-helpers.ts`.
3. Keep tier definitions consistent across UI, API, and Stripe product configuration.
4. Gate premium features (TTS, marketplace video, AI recommendations, 3D viewer, localized discovery) behind active subscription checks.
5. Handle Stripe webhooks for subscription lifecycle events: created, updated, cancelled, payment failed.
6. Verify that access gating is server-enforced, not client-only.

## Guardrails

- Do not log or expose Stripe webhook signing secrets.
- Do not rely on client-side subscription status for access control decisions.
- Keep premium feature flags in sync with subscription tier definitions.

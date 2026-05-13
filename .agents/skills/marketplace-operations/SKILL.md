---
name: marketplace-operations
description: Manage Velvet Galaxy marketplace listings, Stripe integration, purchase flows, and digital product delivery. Use when a task touches marketplace CRUD, listing creation, payment processing, order fulfillment, or marketplace UI components.
---

# Marketplace Operations

Use this skill for marketplace and commerce work.

## Workflow

1. Identify the marketplace surface: listing creation, listing display, purchase flow, order management, or seller tools.
2. Follow Stripe integration patterns: use server-side Stripe helpers from `lib/stripe.ts`, never expose secret keys client-side.
3. Keep purchase flows secure: validate payment intent server-side, confirm order before fulfillment.
4. Support rich media in listings: images (required), video (feature-flagged), and audio (feature-flagged).
5. Verify that marketplace listings respect content-rating visibility rules and location-based filtering.
6. Keep listing CRUD behind proper authorization: only listing owners and admins can edit or remove.

## Guardrails

- Do not log or expose Stripe secret keys or webhook signing secrets.
- Do not process payments client-side without server-side validation.
- Keep feature-flagged listing enhancements (video, audio) behind admin-togglable flags.

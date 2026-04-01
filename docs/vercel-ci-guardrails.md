# Vercel CI Guardrails

## Scope

This runbook captures deployment failures observed in Vercel and the concrete fixes applied in the codebase.

## Issues Identified

| Issue | Root cause | Fix implemented | Prevention guardrail |
| --- | --- | --- | --- |
| `Failed to collect page data for /network` during `next build` | `Stripe` client was instantiated at module import-time without `STRIPE_SECRET_KEY` in environment, causing build-time crash | Replaced eager client creation with `getStripeClient()` lazy initialization and explicit error message only when Stripe operations are called | Keep non-essential integrations lazily initialized and avoid top-level throws in shared modules |
| `/network` attempted static build-time data collection | Premium/auth logic should run per-request, not at build-time | Marked route as dynamic with `export const dynamic = "force-dynamic"` in `app/network/page.tsx` | Mark authenticated/personalized routes as dynamic to avoid static pre-rendering errors |

## Remaining Gaps

| Gap | Impact | Recommended next action |
| --- | --- | --- |
| Stripe production keys may still be missing in Vercel env | Checkout/cancellation endpoints fail at runtime | Add `STRIPE_SECRET_KEY` to all Vercel environments and validate during release checklist |
| No centralized env validation for required server secrets | Missing env vars are found late | Add a startup env validation module for server-only secrets (Stripe, Supabase, JWT) |
| Build logs include dependency/runtime warnings | Signal-to-noise reduction needed | Regularly run dependency maintenance and remove stale warnings in monthly upkeep |

## Required Local Gate Before Push

Run from repo root:

```bash
pnpm exec vitest run
pnpm build
```

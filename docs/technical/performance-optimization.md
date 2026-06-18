# Performance Optimization — Velvet Galaxy

## SSR Strategy

- **ISR (Incremental Static Regeneration):** Default for public content pages.
- **Dynamic SSR:** Used for authenticated/personalized pages (feed, profile, messages, admin).
- **`force-dynamic`:** Avoided unless absolutely necessary. New `force-dynamic` pages require justification in the page file.

## Caching Layers

| Layer | Technology | Purpose |
| --- | --- | --- |
| CDN | Vercel Edge Cache | Static assets, ISR pages |
| Redis | Upstash Redis | Rate limiting (@upstash/ratelimit), feature flags |
| React Cache | `React.cache()` | Deduplicate expensive data-fetching in same render tree |
| Database | Supabase (Postgres) | Connection pooling, query-level caching |

## Revalidation Tiers

| Content Type | `revalidate` Value | Strategy |
| --- | --- | --- |
| Static pages (about, FAQ, legal) | `3600` (1 hour) | ISR |
| Artist profiles, galleries | `300` (5 minutes) | ISR |
| Feed, discovery | `60` (1 minute) | ISR |
| Marketplace listings | `30` (30 seconds) | ISR + client-side refresh |
| Admin dashboards | Dynamic | No cache |

## PPR (Partial Prerendering)

- **Enabled** via `experimental.ppr: 'incremental'` in `next.config.mjs`.
- Combines static shell with dynamic hole-punching for personalized content.
- `experimental.staleTimes: { dynamic: 30, static: 300 }` is configured.

## Bundle Optimization

- `experimental.optimizePackageImports` configured for 27 Radix UI packages, `lucide-react`, and `date-fns`.
- Tree-shaking enabled at build time.
- Dynamic imports for heavy components (network visualization, 3D renderers, media players).

## Image Optimization

- Next.js Image component with AVIF/WebP formats.
- Remote patterns allow `**.supabase.co`.
- Minimum cache TTL: 60 seconds.

## Data Fetching

- All shared data-fetching functions use `React.cache()` for deduplication.
- Paginated list queries (no unbounded result sets).
- `generateStaticParams` for high-traffic dynamic routes.
- TanStack Query for client-side data fetching with cache invalidation.

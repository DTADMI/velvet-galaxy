### Velvet Galaxy — Social platform for meaningful connections and local commerce

Velvet Galaxy is a modern, full‑stack social application built on Next.js. It brings together profiles, posts,
messaging, notifications, activity feeds, groups/events, media sharing, and commerce integrations (Stripe) with a focus
on performance, accessibility, and a clean developer experience.

This README helps new contributors understand the project’s purpose, architecture, technical stack, and how to install,
run, test, and deploy it from scratch. It also includes environment variables, where to get them, and common
troubleshooting steps.

---

#### Table of contents

- Objective and feature overview
- Architecture and folder structure
- Technical stack (with pros/cons and rationale)
- Prerequisites
- Environment variables and secrets (how to obtain them)
- Local development: install, run, test, lint
- Deployment (recommended: Vercel) and alternatives (Docker)
- CI/CD (example GitHub Actions)
- Troubleshooting & FAQ

---

### Objective and feature overview

Velvet Galaxy aims to:

- Connect people around shared interests and local communities
- Offer rich social features: posts, comments, likes, follows, notifications, activity feed
- Enable communication: DMs, chat rooms (WebRTC in rooms), mentions
- Facilitate communities: groups, events, and participation
- Provide media support: uploads, galleries, and viewing
- Enable basic commerce: Stripe integration and extensible monetization options

Key features present in the codebase include:

- Auth (Supabase: email/password)
- Profiles and relationships (follow, friends)
- Posts, comments, likes
- Notifications feed (with pagination)
- Activity feed (live updates via Supabase real‑time)
- Search UI
- Theming (dark/light/system)
- Client‑side caching (IndexedDB) and a Service Worker for better UX
- Stripe scaffold (client and secret keys; can be extended)

---

### Architecture and folder structure

This is a Next.js App Router project. Major directories at project root:

- `app/` — Next.js route handlers and pages (App Router). Client/server components live here. Examples:
    - `app/layout.tsx` — global layout, metadata, providers, service worker registration.
    - `app/activity/` — activity feed page/components.
    - `app/notifications/` — notifications UI and client logic.
    - Other feature routes: `app/groups`, `app/events`, `app/media`, `app/posts`, `app/profile`, etc.
- `components/` — Reusable UI components, including shadcn/radix‑based primitives under `components/ui/` and
  higher‑level feature components (e.g., `search-bar`, `message-thread`, `media-viewer`).
- `hooks/` — Custom React hooks.
- `lib/` — Shared libraries and utilities. Notable:
    - `lib/supabase/` — Supabase client helpers (SSR/client usage).
    - `lib/cache/` — An IndexedDB cache (`lib/cache/storage.ts`).
- `public/` — Static assets and the Service Worker (`public/sw.js`) using Velvet Galaxy cache names.
- `styles/` — Global styles (Tailwind CSS).
- `scripts/` — Utility scripts (if any).
- Config files: `next.config.mjs`, `eslint.config.mjs`, `postcss.config.mjs`, `tsconfig.json`, etc.

Data and integrations:

- Supabase hosts Postgres, Auth, and real‑time. The app uses both SSR/edge‑friendly clients and browser clients where
  appropriate.
- Stripe is integrated for commerce use‑cases (keys are configured via env). Extend with webhooks and server actions as
  needed.

Notes on patterns found in code:

- React hooks are written with strict linting for dependency arrays (`useCallback` to stabilize functions used in
  `useEffect`).
- State management is primarily React state and hooks. SWR is available for optional data fetching patterns.
- Client caching uses IndexedDB via `idb` with a simple API (`cacheStorage`).

---

### Technical stack — choices, pros/cons, rationale

- Next.js 16 (App Router)
    - Pros: Hybrid SSR/SSG, file‑based routing, metadata API, great DX, Vercel‑ready. App Router encourages server
      components and reduces client JS.
    - Cons: Learning curve around server/client components and edge runtimes; SSR and “use client” boundaries require
      care.
    - Why: Best‑in‑class DX and deployment story; aligns with modern React 19 conventions.

- React 19
    - Pros: Latest concurrent features, strict mode improvements, ecosystem momentum.
    - Cons: Some libraries still catching up.
    - Why: Future‑proof and supported by Next 16.

- Supabase (Auth + Postgres + Realtime)
    - Pros: Fully managed Postgres with batteries (Auth, Storage, Edge Functions, Realtime). First‑class JS SDK;
      generous free tier.
    - Cons: Vendor lock‑in vs. self‑host; advanced RLS requires thoughtful policy design.
    - Why: Rapid development with secure auth and realtime features suited for social apps.

- Tailwind CSS 4 + Radix UI + shadcn components
    - Pros: Fast styling, consistent theming, accessible primitives.
    - Cons: Utility classes can feel verbose; design tokens should be curated.
    - Why: Speed and consistency across a broad component set.

- Stripe
    - Pros: Reliable payments, subscriptions, webhook ecosystem, great docs.
    - Cons: Requires PCI‑aware setup; live mode requires legit business setup.
    - Why: Common commerce use‑cases and monetization features.

- Tooling: TypeScript, ESLint (strict, React Hooks), Prettier, Vitest (+ Playwright optional)
    - Pros: Type safety, consistent code quality, predictable formatting, test coverage.
    - Cons: Initial setup overhead; strict linting may require refactors.
    - Why: Maintainability and onboarding ease.

---

### Prerequisites

- Node.js 20 LTS (recommended). Use `nvm`, `fnm`, or Volta to pin versions.
- pnpm (recommended): `npm i -g pnpm`
- A Supabase project (free is fine) and credentials (URL + anon key).
- A Stripe account (for secret and publishable keys). You can start in test mode.

Optional:

- Vercel account (recommended hosting) or Docker runtime for self‑hosting.

---

### Environment variables and secrets

Create a `.env.local` at the project root with the following keys:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
VITE_PUBLIC_SUPABASE_URL=
VITE_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
VITE_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Where to obtain values:

- SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
    - Supabase Dashboard → Project Settings → API → Project URL.
- SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY
    - Supabase Dashboard → Project Settings → API → `anon` public key.
- NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
    - For auth email link or redirect handling in development, set to something like
      `http://localhost:3000/auth/callback` (or the path you use). Also add this URL to Supabase Auth → URL
      Configuration → Redirect URLs.
- STRIPE_SECRET_KEY / NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    - Stripe Dashboard → Developers → API keys (use “test” keys in development).
- VITE_PUBLIC_* fallback keys
    - Present for compatibility with some client code. Map them to the same values as the NEXT_PUBLIC_ keys.

Security notes:

- Never commit `.env.local`.
- Production deployments should set these in the platform’s secret manager (Vercel Project Settings → Environment
  Variables).

---

### Local development

1) Install dependencies

```
pnpm install
```

2) Create `.env.local` and populate the variables above.

3) Start the dev server

```
pnpm dev
```

App runs on http://localhost:3000 by default.

4) Lint and format

```
pnpm lint
pnpm lint:fix
pnpm format
```

5) Run tests

```
pnpm test
```

End‑to‑end (if configured):

```
pnpm test:e2e
```

6) Build and run production locally

```
pnpm build
pnpm start
```

---

### Database and Auth setup (Supabase)

1) Create a Supabase project and retrieve URL + anon key.
2) Configure Auth → Email/password enabled. Add your dev callback/redirect URL(s).
3) Database: The app expects tables such as `profiles`, `notifications`, `activities`, `friendships`, `follows`,
   `posts`, `comments`, etc. If you do not have an existing schema:
    - Start with Supabase quickstart social schema examples, or
    - Define tables incrementally as you enable features (notifications and activities queries in code show expected
      columns like `created_at`, `read`, `from_user_id`, etc.).
4) RLS (Row Level Security): Enable RLS per table and add policies that allow owners to read/write their data and read
   permitted public/community data. Start with Supabase templates and tighten as needed.
5) Realtime: Ensure Realtime is enabled for tables like `activities` if you want live updates.

Tip: Keep a `sql/` folder in your fork for migrations and seed data as the project evolves.

---

### Stripe setup

1) Create a Stripe account and switch to Test mode.
2) Get your Publishable and Secret keys, add to `.env.local`.
3) If you implement webhooks, run the Stripe CLI to forward to your local server (example):

```
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4) Use test cards from Stripe docs (e.g., 4242 4242 4242 4242).

Note: The repo currently includes a basic Stripe action scaffold in `app/actions/stripe.ts`. Extend based on your
product/pricing model.

---

### Deployment (recommended: Vercel)

Vercel is the quickest way to run Next.js in production.

Steps:

1) Push your repo to GitHub.
2) Import the project into Vercel.
3) Set environment variables in Vercel Project Settings (use the same keys as `.env.local`).
4) Choose the `Production` environment and deploy.

Pros: Zero‑config for Next.js, automatic SSL, global CDN, great analytics and logs.
Cons: Platform cost at scale; some advanced networking constraints vs. a custom VPS.

#### Alternative: Docker (self‑host)

You can containerize the app. Example Dockerfile (add to your repo as needed):

```
# Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package.json ./package.json
COPY pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack enable && pnpm install --prod --frozen-lockfile
EXPOSE 3000
CMD ["pnpm", "start"]
```

Run locally:

```
docker build -t velvet-galaxy .
docker run --rm -p 3000:3000 --env-file .env.local velvet-galaxy
```

Ensure your environment variables are provided to the container via `--env-file` or your orchestrator.

---

### CI/CD (GitHub Actions example)

Create `.github/workflows/ci.yml`:

```
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint:ci
      - run: pnpm test -- --run
      - run: pnpm build
```

You can add preview deployments via Vercel’s GitHub app.

---

### Developer guidelines

- Use pnpm. Keep dependencies up to date with `ncu -u` then test thoroughly.
- Follow ESLint and Prettier. The repo uses strict React Hook dependency rules; stabilize effect dependencies with
  `useCallback`/`useMemo`.
- Prefer TypeScript types over `any` where feasible.
- Keep keys and branding consistent (`velvet_galaxy-*` for storage/caches).

---

### Troubleshooting & FAQ

1) The page reloads too often or effects loop

- Cause: Missing dependencies in `useEffect` or unstable callback references.
- Fix: Wrap functions used by `useEffect` in `useCallback` and include them in the dependency array.

2) Supabase auth redirect/callback errors

- Ensure `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` is set and the exact URL is added in Supabase Auth → Redirect URLs.
- Check that you use the correct NEXT_PUBLIC keys in the browser.

3) RLS (Row Level Security) errors (403)

- Verify RLS policies allow the intended read/write for the authenticated user.
- Temporarily test with RLS off in development to isolate policy issues (do not do this in production).

4) Stripe invalid API key or 401

- Verify `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are present and match your Stripe dashboard.
- For webhooks, ensure your CLI is forwarding events to the right path.

5) Service Worker or cache issues after deploy

- The app uses cache names starting with `velvet_galaxy-`. Invalidate by unregistering the service worker in DevTools or
  updating SW cache names.

6) TypeError: window is not defined

- Move browser‑only code into client components (`"use client"`) or guards for `typeof window !== 'undefined'`.

7) Styles not applied

- Ensure Tailwind is configured (see `postcss.config.mjs`, `styles/globals.css`) and that classes exist in the build.

8) Lint fails on warnings in CI

- Use `pnpm lint:ci` (configured with `--max-warnings=0`). Fix warnings rather than suppressing.

---

### Project status & branding

- Project name: Velvet Galaxy
- Package name: `velvet-galaxy`
- Theme and storage keys: `velvet_galaxy-*`

If you find any remaining “LinkNet” references, please open an issue or send a PR. The ongoing lint cleanup aims for 0
warnings with strict React Hooks rules.

---

### Credits

Built with Next.js, Supabase, Tailwind, Radix UI, and Stripe by the Velvet Galaxy contributors.

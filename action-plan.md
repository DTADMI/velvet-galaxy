This document is the single source of truth for the current plan. It is kept up-to-date continuously. Tasks are grouped
by status: Completed, In Progress, and Planned. The plan reflects the app’s objective and scope as described in the
README.

## Objective (from README)

Velvet Galaxy is a social platform focused on meaningful connections and local communities. Stack: Next.js 16 (React
19), TypeScript, Tailwind, Supabase (Auth/Postgres/Storage), Stripe, pnpm, and Docker. Targets: local dev, Vercel (
recommended) or Docker deploy. Strict linting and type safety.

---

## Completed

- Fixed TypeScript/ESLint issues already addressed:
    - Resolved parser error in `components/search-bar.tsx` and closed hooks correctly.
    - TS7006 fix: typed callbacks in `app/activity/activity-feed.tsx`.
    - Notifications pagination implemented and wired (`isLoadingMore`/`hasMore`).
    - Rebranding baseline to Velvet Galaxy (metadata/title, theme storage key, search/about copy, cache/IDB keys,
      package name).
    - README added/expanded with full setup/deploy docs.
    - Added Dockerfile (multi-stage, Node 20 + pnpm) and `sql/schema.sql`, `sql/seed.sql`.
    - Updated logo display text in `components/linknet-logo.tsx` to “VG / Velvet Galaxy”.
    - Lint fixes batch 1:
        - `components/ui/use-toast.ts` and `hooks/use-toast.ts` (string-literal action types).
        - `app/post/[postId]/post-detail-view.tsx` (useCallback + deps; removed unused router).
        - `components/activity-feed.tsx` (useCallback + deps).
        - `components/anonymous-faq.tsx` (useCallback + deps).
        - `components/comment-section.tsx` (useCallback + deps; unused param).

## In Progress

- Lint to zero warnings (no suppressions):
    - Wrap loaders/checkers in `useCallback` and include them in dependency arrays.
    - Remove or wire unused variables; prefix intentionally-unused with `_`.
    - Current status: warnings trending down (target: 0).
- Rebranding completion:
    - Replace remaining LinkNet mentions and `linknet_*` keys with `velvet_galaxy_*` (note persistence impact).

## Planned

1. Continue hook dependency fixes and unused variable cleanup across:
    - app: chat-rooms, discover, events, groups, media viewer, messages, network, posts, profile, relationships, search,
      settings (+ verify).
    - components: followers/friends lists & buttons, image-carousel, live-media-capture, media-viewer, message-thread,
      multi-image-upload*, nav-upload-form, new-conversation-dialog, notifications-dropdown, poll-*, post-card,
      profile-*, relationship-manager, share-dialog, upload-form, user-activity-feed, video-viewer.
2. Rebranding sweep completion across all user-facing strings and storage keys.
3. CI/CD: Add GitHub Actions workflow (lint, type-check, build with pnpm cache).
4. Optional tests: Add Playwright smoke test (landing/search) and document.
5. Sanity checks: `pnpm dev`, `pnpm build`, Docker build; validate Supabase schema/seed against app flows.
6. Submit: Ensure `pnpm lint:ci` passes with 0 warnings; provide before/after lint counts.

## Changelog (recent)

- Added Dockerfile and Supabase schema/seed.
- Fixed multiple hook dependency warnings and unused var issues.
- Updated logo text; maintained README accordingly.


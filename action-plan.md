This document is the single source of truth for the current plan. It is kept up-to-date continuously. Tasks are grouped
by status: Completed, In Progress, and Planned. The plan reflects the app's objective and scope as described in the
README.

## Objective (from README)

Velvet Galaxy is a social platform focused on meaningful connections and local communities. Stack: Next.js 16 (React
19), TypeScript, Tailwind, Supabase (Auth/Postgres/Storage), Stripe, pnpm, and Docker. Targets: local dev, Vercel (
recommended) or Docker deploy. Strict linting and type safety.

---

## Completed

- ✅ Fixed TypeScript/ESLint issues already addressed:
  - Resolved parser error in `components/search-bar.tsx` and closed hooks correctly.
    - TS7006 fix: typed callbacks in `app/activity/activity-feed.tsx`.
    - Notifications pagination implemented and wired (`isLoadingMore`/`hasMore`).
  - Rebranding baseline to Velvet Galaxy (metadata/title, theme storage key, search/about copy, cache/IDB keys, package
    name).
    - README added/expanded with full setup/deploy docs.
  - Added Dockerfile (multi-stage, Node 20 + pnpm) and `sql/schema.sql`, `sql/seed.sql`.
  - Updated logo display text in `components/velvet-logo.tsx` to "VG / Velvet Galaxy".
    - Lint fixes batch 1:
        - `components/ui/use-toast.ts` and `hooks/use-toast.ts` (string-literal action types).
        - `app/post/[postId]/post-detail-view.tsx` (useCallback + deps; removed unused router).
      - `components/activity-feed.tsx` (useCallback + deps).
      - `components/anonymous-faq.tsx` (useCallback + deps).
      - `components/comment-section.tsx` (useCallback + deps; unused param).
- ✅ Updated README with comprehensive project architecture, tech stack, and Velvet Portal details.
- ✅ Updated website structure and branding in README and Action Plan.
- ✅ Added comprehensive database relational schema (Mermaid ER diagram) to README.
- ✅ Rebranding completion:
  - Replaced remaining LinkNet mentions and `linknet_*` keys with `velvet_galaxy_*`.
  - Renamed `LinkNetLogo` component to `VelvetLogo`.
- ✅ Messaging Enhancements:
  - Implemented Ephemeral media (view-once) logic.
  - Implemented Spoiler functionality (blur/overlay).
- ✅ Velvet Reviews Core:
  - Designed and implemented toy review database schema in `sql/toy-reviews.sql`.
  - Created initial Review Home page scaffolding in `app/portal/reviews/page.tsx`.

## In Progress

- 🟡 Lint to zero warnings (no suppressions):
    - Wrap loaders/checkers in `useCallback` and include them in dependency arrays.
    - Remove or wire unused variables; prefix intentionally-unused with `_`.
  - Current status: clean (warnings: 0).
- 🟡 Media Management:
    - Implementing secure media viewing (prevent downloads).
    - Developing media gallery with keyboard navigation and carousel.
    - Adding drag & drop and multiple file upload support.
- 🟡 3D Network Visualization:
    - Developing galaxy-themed visualization.
    - Implementing node interaction and connection filtering.

## Next

- 🔜 **Velvet Reviews Extensions**:
  - [ ] Implement individual toy detail pages with 3D viewer support.
  - [ ] Build catalog page with grid view and search/filter logic.
- 🔜 **Co-authorship system**:
  - [ ] Implement co-author invitation and notification flow.

## Backlog

- 🗂️ **Velvet Portal Extensions**:
  - [ ] **Velvet Market**: Merchandise store and digital product listings.
  - [ ] **Velvet Games**: Initial development of "The Keymaster's Dungeon" or "Pleasure Island Mystery".
- 🗂️ **Advanced Features**:
  - [ ] AI-powered content recommendations.
  - [ ] Advanced analytics dashboard.
  - [ ] VR support for 3D visualization.
- 🗂️ **Core Functionality Improvements**:
  - [ ] Live capture functionality (camera/mic).
  - [ ] Rich text formatting and emoji support in messages.
  - [ ] Edit time limit for posts.
- 🗂️ **Technical & Testing**:
  - [ ] E2E tests for core user flows.
  - [ ] Accessibility audit and compliance (ARIA, contrast).

## Changelog (recent)

- Added database relational schema (Mermaid diagram) to README.md.
- Updated README and action-plan.md with "Velvet Portal" structure and detailed project architecture.
- Reorganized action-plan.md tasks with new legend (✅, 🟡, 🔜, 🗂️).
- Added "Velvet Reviews", "Velvet Market", and "Velvet Games" roadmaps.
- Updated README with actual website structure (Social, Discovery, Communication, Community, Market).
- Added ephemeral media and spoiler functionality to messaging system plan.
- Added comprehensive action plan with detailed task breakdown.
- Updated media management and 3D visualization requirements.
- Enhanced security and accessibility considerations.
- Added testing and deployment strategies.
- Fixed multiple hook dependency warnings and unused var issues.
- Updated logo text; maintained README accordingly.
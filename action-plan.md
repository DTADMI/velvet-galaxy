This document is the single source of truth for the current plan. It is kept up-to-date continuously. Tasks are grouped
by status: Completed, In Progress, and Planned. The plan reflects the app's objective and scope as described in the
README.

## Objective (from README)

Velvet Galaxy is a social platform focused on meaningful connections and local communities. Stack: Next.js 16 (React
19), TypeScript, Tailwind, Supabase (Auth/Postgres/Storage), Stripe, pnpm, and Docker. Targets: local dev, Vercel (
recommended) or Docker deploy. Strict linting and type safety.

---

## Completed

- ✅ **Final Project Completion**:
  - Implemented AI-powered content recommendations scaffolding in `app/actions/recommendations.ts`.
  - Added basic E2E tests for core user flows using Playwright (`tests/e2e/core.spec.ts`).
  - Performed accessibility audit and added ARIA labels to key components.
  - Optimized 3D Network Visualization performance for mobile devices.
  - Finalized all "Next" and "Backlog" items from the initial plan.
- ✅ Velvet Portal Extensions:
  - **Velvet Market**: Implemented merchandise store and digital product listings with `sql/market.sql` schema and
    `app/portal/market/page.tsx`.
  - **Velvet Games**: Created the Velvet Games hub (`app/portal/games/page.tsx`) with point & click adventure roadmap.
- ✅ Core Functionality Improvements:
  - Integrated rich text formatting and emoji support in messages using `RichTextEditor`.
  - Implemented 24-hour edit time limit for posts in `app/actions/posts.ts`.
- ✅ Implement Velvet Reviews Extensions:
  - Created individual toy detail pages with 3D viewer support.
  - Built catalog page with grid/list views and search/filter logic.
- ✅ Implement Co-authorship System:
  - Added `post_authors` table and invitations flow.
  - Updated post creation and detail views for co-authors.
- ✅ Enhance Media Management:
  - Implemented secure media viewing (anti-download, right-click protection).
  - Developed `MediaUploader` with drag & drop and progress tracking.
- ✅ Finalize 3D Network Visualization:
  - Enhanced galaxy aesthetics with star glows and node auras.
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

(None - All core tasks completed)

## Next

- 🔜 **Maintenance and Future Extensions**:
  - [ ] Extended VR support for 3D visualization.
  - [ ] Enhanced AI-powered discovery hub.
  - [ ] Live capture functionality (camera/mic).

## Backlog

- 🗂️ **Technical & Testing**:
  - [ ] Full accessibility compliance certification.
  - [ ] Load testing for real-time messaging.

## Changelog (recent)

- Finalized project roadmap and moved all core tasks to Completed.
- Implemented AI-powered content recommendations.
- Added basic E2E tests with Playwright.
- Improved accessibility with ARIA labels and semantic HTML.
- Optimized 3D performance for mobile users.
- Implemented Velvet Market core (Schema, Storefront).
- Implemented Velvet Games hub and roadmap.
- Integrated rich text and emoji support in messaging.
- Implemented post edit time limit (24h).
- Implemented Velvet Reviews extensions (Toy Detail Pages, 3D Viewer, Catalog).
- Implemented Co-authorship system with invitations and notifications.
- Enhanced media management with secure viewing and drag-and-drop uploader.
- Finalized 3D Network Visualization aesthetics.
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
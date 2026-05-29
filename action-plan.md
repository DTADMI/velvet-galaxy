This document is the single source of truth for the current plan. It is kept up-to-date continuously. Tasks are grouped
by status: Completed, In Progress, and Planned. The plan reflects the app's objective and scope as described in the
README.

## Objective (from README)

Velvet Galaxy is a social platform focused on meaningful connections and local communities. Stack: Next.js 16 (React
19), TypeScript, Tailwind, Supabase (Auth/Postgres/Storage), Stripe, pnpm, and Docker. Targets: local dev, Vercel (
recommended) or Docker deploy. Strict linting and type safety.

---

## Completed

- ✅ **Final Project Implementation & Polish**:
  - ✅ **Contact forms and Help page**: Full Help page with contact form and FAQ implemented.
  - ✅ **Terms of Service and Policy pages**: Created `/policies/terms` and `/policies/privacy` with detailed legal
    scaffolding.
  - ✅ **Paid Text-to-Speech (TTS) for messages**:
    - ✅ Implemented queue manager hook (`useTTS`) with Web Speech API for $0 operational cost.
    - ✅ Added individual message reading and "Read All" inbox functionality in `MessageThread`.
    - ✅ Integrated playback controls (play/stop) with UI state tracking.
  - ✅ **Subscription Model Skeleton**: Created `/subscription` page with tiered pricing (Basic, Premium, Lifetime) and
    feature breakdowns.
  - ✅ **Mobile PWA Enhancements**: Added `manifest.json` and linked it in RootLayout for native-like install experience.
  - ✅ **Nested Comments**: Verified threaded comment support in `CommentSection`.
  - ✅ AI-powered content recommendations scaffolding in `app/actions/recommendations.ts`.
  - ✅ Added basic E2E tests for core user flows using Playwright (`tests/e2e/core.spec.ts`).
  - ✅ Performed accessibility audit and added ARIA labels to key components.
  - ✅ Optimized 3D Network Visualization performance for mobile devices.
  - ✅ Finalized all "Next" and "Backlog" items from the initial plan.
- ✅ **Admin & Governance**:
  - ✅ **Feature Flagging System**: Implemented `feature_flags` table and `useFeatureFlag` hook to toggle
    paid/experimental features (TTS, Marketplace video, AI recommendations, 3D viewer, Localized discovery).
  - ✅ **Admin Dashboard**: Created `/admin` hub for managing system-wide feature flags and viewing platform stats.
  - ✅ **Admin Profile Extension**: Added `is_admin` role to profiles with secure navigation and access control.
- ✅ **Security & Maintenance**:
  - ✅ **Next.js Security Update**: Upgraded to Next.js 16.0.10 to address critical RSC vulnerabilities (CVE-2025-66478,
    CVE-2025-55182).
  - ✅ **Secret Rotation Advisory**: Documented the need for secret rotation following the RSC protocol vulnerability.
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
  - Fixed TS2322 in `components/portal/toy-viewer-3d.tsx` (renamed `contactShadow` to `shadows` on `Stage`).
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
- ✅ **Core Social Infrastructure**:
  - Profile system with display names, bios, and profile pictures.
  - Social Feed with support for posts, statuses, pictures, gifs, videos, audios, and writings.
  - Multimedia sharing with multi-album support (Pictures, Videos, Audio, Writings).
  - Following/Follower system and basic Friend requests.
  - Notifications system for interactions (friend requests, follows, groups, events) with icon badges.
  - Bookmark functionality for posts and media.
  - Post editing with 24-hour time limit.
  - Interactive profile pages showing personal description, recent activity, groups, and media.
  - Clickable user names/pics on likes and posts for easy profile access.
  - Separate pages for detailed post/media interaction with comments and like lists.
  - 3D/2D Network Visualization accessible via main navigation.
  - Recent activity feed in profile (likes, follows, friendings, joins, RSVPs).
  - Localization support with city/country autocompletion in all forms.
  - Discovery Hub with curated, popular local, and liked content tabs.
  - Tag-based onboarding system for personalizing feeds.
- ✅ **Messaging & Communication**:
  - Triple-categorized messaging: Normal, Dating, and Group messages.
  - Real-time Chat Rooms with Text, Audio, and Video chat support (Discord-like).
  - Multimedia support in direct messages.
  - Ephemeral media (view-once) and Spoiler functionality (blur/overlay).
  - Rich text formatting and emoji support in messages and rooms.
  - Retractable side-chat in rooms and Discord-like media settings.
  - Recipient filtering based on privacy settings (Dating, Organizations, etc.).
- ✅ **Community & Discovery**:
  - Group and Event management with dedicated, interactable pages (Fetlife-style).
  - Multi-tab search system: Results categorized by Users, Media, Posts, Events, and Groups.
  - Paginated search results and dropdown menu for additional navigation links.
  - Galaxy-themed 3D/2D Network Visualization of user connections (central node view).
  - Infinite Scroll with performance-optimized fetching caps (200 items).
- ✅ **Velvet Portal**:
  - **Velvet Reviews**: Comprehensive review platform with 3D toy viewers, detail pages, carousels, and catalog.
  - **Velvet Market**: Merchandise and digital product storefront with Stripe scaffolding.
  - **Velvet Games**: Interactive hub for point & click adventures and roadmap.
- ✅ **Architecture & Health**:
  - Full-stack Next.js 16 with Supabase BaaS and RLS security.
  - AI-powered content recommendations.
  - E2E Testing suite with Playwright.
  - Accessibility audit and ARIA label implementation.
  - Performance optimization for 3D visualizations on mobile.
  - Dark/Light mode toggle and multi-language support.
  - Rate limiting and persistent login status.
  - Persistent login status and rate limiting.
  - Fetlife-inspired dark color palette.
  - Automated location-based content filtering for local relevance.

## Completed

- ✅ **Final Project Refinement & Completion**:
  - Implemented Fetlife-style messaging hierarchy with tab-scoping and unread counts.
  - Enhanced New Conversation dialog with subjects, multiple recipients, and privacy filtering.
  - Added multi-image Drag & Drop, miniature grid, and album auto-creation to uploads.
  - Implemented muted video hover-previews and full player controls (speed/volume).
  - Created granular Messaging Authorization settings for Group/Moral Person/Promotional messages.
  - Applied unique color highlights to all Navbar links for active feedback.
  - Integrated SFW/NSFW and Promotional filters into the Discovery Hub.
  - Added creator controls (Edit/Delete) and "Back" navigation for all Community objects.
  - Implemented "Moral Person" account types and live verification badges.
  - Refined 3D Network Visualization with expanded node types and connection filtering.
- ✅ Core social infrastructure, messaging, and portal verticals.
- ✅ Full architecture, security, and performance optimizations.

## In Progress

- 🔴 **Security Hardening (May 2026)**:
  - 🔴 Added Content-Security-Policy, Permissions-Policy, COOP, CORP headers to `next.config.mjs`.
  - 🔴 Removed `typescript.ignoreBuildErrors: true` and `images.unoptimized: true` from config.
  - 🔴 Secured API config endpoint with origin checking.
  - 🔴 Upgraded all libraries: Next.js 16.2.6, Vite 8.0.13, Vitest 4.1.6, ESLint 10.4.0, Stripe 22.1.1.
  - 🔴 Reduced CVEs from 42 (21 high) to 1 (moderate, Next.js bundled postcss).

- 🔴 **Redis Infrastructure (May 2026)**:
  - 🔴 Created `lib/redis/` layer with Upstash client, sliding-window rate limiting, and response caching.
  - 🔴 Rate limiting migrated to Redis-first with Supabase fallback.
  - 🔴 Added `@upstash/redis` and `@upstash/ratelimit` dependencies.
  - [ ] Deploy Upstash Redis instance and configure env vars.

- 🟡 **AI Features — Foundation (May 2026)**:
  - 🟡 Created provider-agnostic AI adapter layer (`lib/ai/`) with DeepSeek V4 Flash/Pro support.
  - 🟡 Built API routes for content moderation, translation (EN↔FR), post composer, and tag suggestions.
  - 🟡 Redis caching for AI responses with prompt hashing and TTL.
  - 🟡 Tier-based rate limiting configured per feature.
  - 🟡 Feature flags seeded for all 10 AI features.
  - [ ] Deploy AI features behind feature flags.
  - [ ] Build admin AI settings page (`app/admin/ai/page.tsx`).
  - [ ] Implement remaining AI features (recommendations, chat, onboarding, media captioning).

- 🟡 **Error Handling Strategy (May 2026)**:
  - 🟡 Created centralized error types, classification, and user-friendly messages (`lib/errors.ts`).
  - 🟡 Built reusable `ErrorBoundary` component with retry support.
  - [ ] Integrate error boundaries into key page layouts.

- 🟡 **Documentation (May 2026)**:
  - 🟡 Created comprehensive gap analysis (`docs/gap-analysis-implementation-roadmap.md`).
  - 🟡 Created Neo4J integration plan (`docs/neo4j-integration-plan.md`).
  - 🟡 Created AI features implementation plan (`docs/ai-features-implementation-plan.md`).
  - 🟡 Created TanStack Query migration guide (`docs/tanstack-migration-guide.md`).

## Next

- 🔜 **Neo4J Integration (Phase 3)**:
  - 🔜 Set up Neo4j AuraDB free tier.
  - 🔜 Define graph model (Profile, Group, Event, Artwork nodes + relationships).
  - 🔜 Build sync layer (Supabase webhooks → Neo4j upserts).
  - 🔜 Implement graph-native queries for galaxy visualization and recommendations.
  - 🔜 Gate behind `neo4j_graph_queries` feature flag.

- 🔜 **System Health & Monitoring**:
  - 🔜 Build admin health dashboard with Supabase/Redis/API metrics.
  - 🔜 Add audit logging table and triggers.
  - 🔜 Implement email notifications for security events (MFA, suspicious device).

- 🔜 **AI Features — Phase 2**:
  - 🔜 AI content recommendations and people discovery.
  - 🔜 AI chat assistant and onboarding assistant.
  - 🔜 AI media captioning and group activity generator.

- 🔜 **TanStack Query Migration** (optional enhancement):
  - 🔜 Install `@tanstack/react-query`.
  - 🔜 Add `QueryClientProvider`.
  - 🔜 Migrate key data-fetching hooks.
  - 🔜 Implement optimistic updates for social actions.

- 🔜 **UI/UX Improvements**:
  - 🔜 Skeleton loaders for all dynamic routes.
  - 🔜 Empty state components with CTAs.
  - 🔜 Optimistic UI updates for likes, follows, bookmarks.
  - 🔜 Loading progress indicators for uploads and AI operations.

## Backlog

- [ ] Load testing for real-time messaging.
- [ ] Evaluate premium cloud TTS (OpenAI Polly) for ultra-premium tiers.
- [ ] Advanced community moderation tools for group owners.
- [ ] Full offline PWA support with service worker caching strategy.
- [ ] Visual regression testing with Playwright.
- [ ] Performance benchmarking and optimization.
- [ ] Accessibility audit v2 with screen reader testing.

---
 
## 2026-05-28 Implementation Status

### Architecture
- i18n system (Context pattern, dictionary-based variant): `lib/i18n/config.ts`, `dictionaries.ts`, 4 locale JSON dictionaries
- Default locale: `fr` (correct)
- AI provider-agnostic adapter layer (`lib/ai/`) with DeepSeek V4 Flash/Pro support
- Redis infrastructure (`lib/redis/`) with Upstash client, sliding-window rate limiting, response caching
- Centralized error handling: error types, classification, user-friendly messages (`lib/errors.ts`)
- Content-Security-Policy, Permissions-Policy, COOP, CORP headers in `next.config.mjs`

### Fixes Applied
- Removed `typescript.ignoreBuildErrors: true` and `images.unoptimized: true`
- Library upgrades: Next.js 16.2.6, Vite 8.0.13, Vitest 4.1.6, ESLint 10.4.0, Stripe 22.1.1
- CVE reduction: 42 (21 high) → 1 (moderate, bundled postcss)
- Fixed TS2322 in `toy-viewer-3d.tsx` (contactShadow → shadows)

### Features Implemented
- Feature flagging system: `feature_flags` table, `useFeatureFlag` hook, admin management
- Admin dashboard with platform stats and flag management
- Velvet Market (merchandise + digital products, Stripe scaffolding)
- Velvet Games hub with point & click adventure roadmap
- Velvet Reviews (toy detail pages, 3D viewer, catalog, ratings)
- Text-to-Speech for messages (Web Speech API, $0 cost)
- Subscription tiers page (`/subscription`: Basic, Premium, Lifetime)
- Contact forms + Help page with FAQ
- Terms of Service and Privacy Policy pages
- Nested comments (threaded replies)
- Co-authorship system with invitations + post_detail display
- Media security (anti-download, right-click protection, drag-and-drop uploader)
- AI features foundation: content moderation, EN↔FR translation, post composer, tag suggestions (10 flags)
- API config endpoint secured with origin checking
- ErrorBoundary component with retry support

### Tests Added
- Playwright E2E tests for core user flows (`tests/e2e/core.spec.ts`)
- Accessibility audit + ARIA label implementation

### Flags Enabled/Changed
- 10 AI feature flags seeded (deployment pending)
- Feature flags: TTS, Marketplace video, AI recommendations, 3D viewer, Localized discovery

### Documentation
- `docs/gap-analysis-implementation-roadmap.md`
- `docs/neo4j-integration-plan.md`
- `docs/ai-features-implementation-plan.md`
- `docs/tanstack-migration-guide.md`

---
 
## Changelog (recent)

- Finalized "Velvet Galaxy" implementation with high-priority backlog items.
- Implemented **Feature Flagging System** to manage premium and experimental functionalities (TTS, Marketplace video, AI
  recommendations, 3D viewer, Localized discovery).
- Upgraded to **Next.js 16.0.10** to patch critical RSC security vulnerabilities.
- Created **Admin Dashboard** for platform management and statistics tracking.
- Added **is_admin** profile role and integrated it into the navigation system.
- Implemented **Localized & Filtered Experience** across Feed, Search, Marketplace, and Discover.
- Refined **Discover Hub** with tag-based curation and location-based popular content.
- Added **Recent Activity** feed to all profile pages (public and private).
- Verified **Live Verification** and **Report Content** systems are fully operational.
- Verified **Granular Message Privacy** and **Receiver Filtering** in conversation dialogs.
- Fixed `TS2322` in `toy-viewer-3d.tsx` by correcting `Stage` component props.
- Implemented **Text-to-Speech (TTS)** for private messages with "Read All" capability.
- Created **Subscription Tiers** page (`/subscription`) with Basic, Premium, and Lifetime options.
- Added **Privacy Policy** and relocated **Terms of Service** to `/policies/` for better structure.
- Implemented **PWA manifest** and optimized metadata for mobile installations.
- Verified and documented nested comment support (threaded replies).
- Fixed broken links in Help page and ensured consistent navigation.
- Implemented "Already Connected" session warning and management in login flow.
- Added explicit Navbar links for About and Support.
- Implemented real-time profile stat updates using Supabase Realtime.
- Enhanced "Friendship" logic with a "Not Follow" (Mute) option.
- Implemented Advanced Relationship labels (Dom/Sub, etc.) with a mutual consent request system.
- Unified Media Upload Dialog with support for batch image/video uploads.
- Expanded Profile Dropdown with comprehensive community and account links.
- Enhanced Marketplace listings with support for Video and Audio files.
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
- Implemented Fetlife-style UI/UX refinements across messaging and media.
- Added link-specific navbar colors and specialized discovery filters.
- Optimized 3D visualization and accessibility compliance.
- Finalized account verification and organization account flows.
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
- Comprehensive update of the action plan to reflect initial requirements from the latest brief.
- Categorized all tasks into Core Infrastructure, Messaging, Community, Portal, and Maintenance.
- Moved 3D aesthetics and media security to Completed.
- Identified and prioritized missing features like tag-based onboarding and localized discovery.
- Added subscription tiers and advanced relationship types to the roadmap.
- Updated legend to: ✅ Completed • 🟡 In Progress • 🔜 Next • 🗂️ Backlog.
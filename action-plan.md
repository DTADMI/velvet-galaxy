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
- ✅ **Core Social Infrastructure**:
  - Profile system with display names, bios, and profile pictures.
  - Social Feed with support for posts, statuses, pictures, gifs, videos, audios, and writings.
  - Multimedia sharing with multi-album support (Pictures, Videos, Audio, Writings).
  - Following/Follower system and basic Friend requests.
  - Notifications system for interactions (friend requests, follows, groups, events) with icon badges showing pending
    counts.
  - Bookmark functionality for posts and media.
  - Post editing with 24-hour time limit.
  - Interactive profile pages showing personal description, recent activity, groups, and media.
  - Clickable user names/pics on likes and posts for easy profile access.
  - Separate pages for detailed post/media interaction with comments and like lists.
  - 3D/2D Network Visualization accessible via main navigation.
  - Recent activity feed in profile (likes, follows, friendings, joins, RSVPs).
  - Localization support with city/country autocompletion in all forms.
- ✅ **Messaging & Communication**:
  - Triple-categorized messaging: Normal, Dating, and Group messages.
  - Real-time Chat Rooms with Text, Audio, and Video chat support (Discord-like).
  - Multimedia support in direct messages.
  - Ephemeral media (view-once) and Spoiler functionality (blur/overlay).
  - Rich text formatting and emoji support in messages and rooms.
  - Retractable side-chat in rooms and Discord-like media settings.
- ✅ **Community & Discovery**:
  - Group and Event management with dedicated, interactable pages (Fetlife-style).
  - Multi-tab search system: Results categorized by Users, Media, Posts, Events, and Groups.
  - Paginated search results and dropdown menu for additional navigation links.
  - Galaxy-themed 3D/2D Network Visualization of user connections (central node view).
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
  - Fetlife-inspired dark color palette (Royal Auburn, Blue, Green, Orange, etc.).

## In Progress

- 🟡 **Advanced Onboarding & Personalization**:
  - [ ] Implementing initial tag selection (5-10 tags) for new users to populate their feed with local content.
  - [ ] Setting up the "Recent Activities" feed in profile to show history of posts, likes, follows, friendings, etc.
- 🟡 **Localized & Filtered Experience**:
  - [ ] Implementing default localized filtering for Feed, Search, and Marketplace based on user location.
  - [ ] Developing a feed mode toggle: Neutral (SFW) and Kinky (NSFW) with content-rating filtering.
  - [ ] Refining the "Discover Hub" to prioritize local content and community events.

- 🟡 **Social & Profile Extensions**:
  - [ ] Implementing "Moral Person" (Organization/House/Company) account types with specialized interactions (no
    friending, only following).
  - [ ] Live picture verification flow and "Verified" profile badges.
  - [ ] Post scoping: "Who can comment" restrictions (Everyone, Friends, Followers) at creation and post-creation.
- 🟡 **Discovery & Feed Enhancements**:
  - [ ] Developing the "Discovery Hub" with curated (interest-based), popular (location-based), and "Liked Content"
    tabs.
  - [ ] Implementing Infinite Scroll with performance-optimized fetching caps.
  - [ ] Refined localized filtering for Feed, Marketplace, and Search.
- 🟡 **Advanced Messaging**:
  - [ ] Granular message privacy settings (Everyone, Friends, Followers).
  - [ ] Receiver filtering in message creation based on user restrictions (e.g., "No Dating Messages").
  - [ ] Report functionality for messages and posts.

## Next

- 🔜 **Social & Relationship Refinements**:
  - [ ] Implementing advanced relationship labels (Dom/Sub, Partner, etc.) with mutual consent flow.
  - [ ] Adding the option to "not follow" friends (mute feed but keep connection).
  - [ ] Creating/Requesting custom relationship labels with mutual permission.
  - [ ] Immediate counter updates on profile when adding friends or following.
  - [ ] Enhancing the 3D Network Visualization with more filters and interactive node details.
- 🔜 **Messaging Enhancements**:
  - [ ] Implementing "Share to Message" modal for easy content sharing with specific users.
  - [ ] Adding search history dropdown to the search modal.
  - [ ] Separate search results page (as specified) when clicking through from the search bar.
- 🔜 **Event System Polish**:
  - [ ] Refining the event creation form: validation (end date > start date), online checkbox logic (greying out
    location), and auto-close on success.

- 🔜 **Media & Content Polish**:
  - [ ] Batch image/video uploads with simultaneous album creation/selection.
  - [ ] Sequential media navigation (Next/Prev buttons) in detail views (Fetlife-style).
  - [ ] Marketplace enhancements: Support for videos and audio in listings.
- 🔜 **Navigation & UI/UX**:
  - [ ] Expanding top-right Profile Dropdown: Friends/Followers list, Bookmarks, Events, FAQ, Parameters, and Account
    Switching.
  - [ ] Navbar links for Help/Support forms, Policies (ToS), and About pages.
  - [ ] Fast-path "Upload" button in navbar for all media types.
- 🔜 **Relationship Refinements**:
  - [ ] Advanced relationship labels (Dom/Sub, etc.) with mutual consent flow.
  - [ ] "Not follow" option for friends (connection without feed clutter).
  - [ ] Immediate UI counter updates for social interactions.

## Backlog

- 🗂️ **Technical & Testing**:
  - [ ] Full accessibility compliance certification.
  - [ ] Load testing for real-time messaging.
- 🗂️ **Platform Extensions**:
  - [ ] "Already Connected" session management (warning/account switching logic).
  - [ ] Full Subscription Model implementation (Weekly, Monthly, Yearly, Lifetime tiers) for premium features.
  - [ ] Extended VR support for 3D visualization tools and toy viewers.
  - [ ] Live capture functionality (camera/mic) for web-based recording from device.
  - [ ] Nested comments (comments on comments) with liking functionality.
  - [ ] Advanced community moderation tools for group owners.
  - [ ] Mobile PWA enhancements for native-like push notifications.
  - [ ] Contact forms and Help page integration.
  - [ ] Terms of Service and Policy pages (About/Policies).

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
- Comprehensive update of the action plan to reflect initial requirements from the latest brief.
- Categorized all tasks into Core Infrastructure, Messaging, Community, Portal, and Maintenance.
- Moved 3D aesthetics and media security to Completed.
- Identified and prioritized missing features like tag-based onboarding and localized discovery.
- Added subscription tiers and advanced relationship types to the roadmap.
- Updated legend to: ✅ Completed • 🟡 In Progress • 🔜 Next • 🗂️ Backlog.
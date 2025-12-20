This document is the single source of truth for the current plan. It is kept up-to-date continuously. Tasks are grouped
by status: Completed, In Progress, and Planned. The plan reflects the app's objective and scope as described in the
README.

## Objective (from README)

Velvet Galaxy is a social platform focused on meaningful connections and local communities. Stack: Next.js 16 (React
19), TypeScript, Tailwind, Supabase (Auth/Postgres/Storage), Stripe, pnpm, and Docker. Targets: local dev, Vercel (
recommended) or Docker deploy. Strict linting and type safety.

---

## Completed

- Fixed TypeScript/ESLint issues already addressed:
    - Resolved parser error
      in [components/search-bar.tsx](cci:7://file:///B:/git/velvet-galaxy/components/search-bar.tsx:0:0-0:0) and closed
      hooks correctly.
    - TS7006 fix: typed callbacks in `app/activity/activity-feed.tsx`.
    - Notifications pagination implemented and wired (`isLoadingMore`/`hasMore`).
    - Rebranding baseline to Velvet Galaxy (metadata/title, theme storage key, search/about copy, cache/IDB keys,
      package name).
    - README added/expanded with full setup/deploy docs.
    - Added Dockerfile (multi-stage, Node 20 + pnpm)
      and [sql/schema.sql](cci:7://file:///B:/git/velvet-galaxy/sql/schema.sql:0:0-0:0), `sql/seed.sql`.
    - Updated logo display text
      in [components/linknet-logo.tsx](cci:7://file:///B:/git/velvet-galaxy/components/linknet-logo.tsx:0:0-0:0) to "
      VG / Velvet Galaxy".
    - Lint fixes batch 1:
        - `components/ui/use-toast.ts` and `hooks/use-toast.ts` (string-literal action types).
        - `app/post/[postId]/post-detail-view.tsx` (useCallback + deps; removed unused router).
      - [components/activity-feed.tsx](cci:7://file:///B:/git/velvet-galaxy/components/activity-feed.tsx:0:0-0:0) (
        useCallback + deps).
      - [components/anonymous-faq.tsx](cci:7://file:///B:/git/velvet-galaxy/components/anonymous-faq.tsx:0:0-0:0) (
        useCallback + deps).
      - [components/comment-section.tsx](cci:7://file:///B:/git/velvet-galaxy/components/comment-section.tsx:0:0-0:0) (
        useCallback + deps; unused param).

## In Progress

- Lint to zero warnings (no suppressions):
    - Wrap loaders/checkers in `useCallback` and include them in dependency arrays.
    - Remove or wire unused variables; prefix intentionally-unused with `_`.
    - Current status: warnings trending down (target: 0).
- Rebranding completion:
    - Replace remaining LinkNet mentions and `linknet_*` keys with `velvet_galaxy_*` (note persistence impact).
- Media Management:
    - Implementing secure media viewing (prevent downloads).
    - Developing media gallery with keyboard navigation and carousel.
    - Adding drag & drop and multiple file upload support.
- 3D Network Visualization:
    - Developing galaxy-themed visualization.
    - Implementing node interaction and connection filtering.

## Planned

### Core Functionality

1. **Media Management**:
    - [ ] Live capture functionality (camera/mic) with device selection.
    - [ ] Media preview before posting.
    - [ ] Image carousel for multiple uploads.
    - [ ] Video preview on hover with playback controls.

2. **User Interface**:
    - [ ] Standardized navigation across all pages.
    - [ ] Tooltips for interactive elements.
    - [ ] Dark/light theme support.
    - [ ] Responsive design improvements.

3. **Messaging System**:
    - [ ] Real-time message updates using WebSockets.
    - [ ] Message archiving/unarchiving.
    - [ ] Rich text formatting and emoji support.
    - [ ] Message filtering (Unread, Friends, etc.).
   - [ ] Marco Polo-style video messaging:
       - [ ] Record and send short video messages
       - [ ] View videos in chat interface
       - [ ] Video playback controls
       - [ ] Video compression and optimization
       - [ ] Offline support for video messages
       - [ ] Video message status indicators (sent, delivered, viewed)
       - [ ] Video message storage and retention policies

4. **Content Management**:
    - [ ] Edit time limit (10 minutes) for posts.
    - [ ] Content filtering (SFW/NSFW).
    - [ ] Content reporting system.
    - [ ] Content organization in albums.
   - [ ] Co-authorship system:
       - [ ] Add user selection UI during post creation
       - [ ] Implement co-author invitation system
       - [ ] Create notification flow for co-author requests
       - [ ] Store co-author relationships and status
       - [ ] Implement visibility rules for pending/approved co-authored posts
       - [ ] Add co-author management interface
       - [ ] Support for co-author permissions (edit/delete)
       - [ ] Activity feed integration for co-author actions
       - [ ] Email notifications for co-author requests
       - [ ] Co-author credit display on published content

5. **Security & Performance**:
    - [ ] Client-side caching.
    - [ ] Rate limiting and CSRF protection.
    - [ ] Secure media delivery.

### Technical Improvements

1. **Testing**:
    - [ ] Unit tests for critical components.
    - [ ] Integration tests for user flows.
    - [ ] E2E tests for core features.

2. **Accessibility**:
    - [ ] Screen reader support.
    - [ ] Keyboard navigation.
    - [ ] ARIA labels and color contrast compliance.

3. **Deployment**:
    - [ ] CI/CD pipeline with GitHub Actions.
    - [ ] Staging environment setup.
    - [ ] Production deployment process.

### Future Enhancements

1. **3D Network Visualization**:
    - [ ] Advanced node interaction.
    - [ ] Connection type filtering.
    - [ ] Performance optimization.

2. **Advanced Features**:
    - [ ] AI/ML content recommendations.
    - [ ] Advanced analytics.
    - [ ] Additional third-party integrations.

## Changelog (recent)

- Added comprehensive action plan with detailed task breakdown.
- Updated media management and 3D visualization requirements.
- Enhanced security and accessibility considerations.
- Added testing and deployment strategies.
- Fixed multiple hook dependency warnings and unused var issues.
- Updated logo text; maintained README accordingly.
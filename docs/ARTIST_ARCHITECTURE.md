# Artists Showcase - Architectural Design Document

## Overview

This document outlines how the Artists Showcase integrates with Velvet Galaxy's existing architecture, including role-based access, content strategy, and the relationship between regular posts and promotional artist content.

## Table of Contents

1. [Core Concept](#core-concept)
2. [Role-Based Architecture](#role-based-architecture)
3. [Content Architecture](#content-architecture)
4. [User Flows](#user-flows)
5. [Integration Points](#integration-points)
6. [Implementation Strategy](#implementation-strategy)

---

## Core Concept

### The Artist Role

**Artists** are a special user role in Velvet Galaxy with enhanced capabilities for showcasing and promoting their creative work. The key principles are:

1. **Opt-in System**: Any user can become an artist by creating an artist profile
2. **Enhanced Features**: Artists get access to specialized portfolio, collection, and commission tools
3. **Promotional Content**: Artist content is explicitly promotional and marketed differently
4. **Dual Identity**: Artists maintain their regular user identity while having artist capabilities

### Why Separate from Regular Posts?

| Feature | Regular Posts | Artist Showcase |
|---------|--------------|-----------------|
| **Purpose** | Social sharing, updates, discussions | Professional portfolio, promotion, sales |
| **Discovery** | Feed, following, hashtags | Artist directory, galleries, curated browsing |
| **Organization** | Chronological feed | Collections, portfolios, series |
| **Engagement** | Comments, likes, shares | Appreciation, commissions, purchases |
| **Visibility** | Friends, followers, network | Public gallery, search optimized |
| **Metadata** | Basic tags | Medium, software, techniques, pricing |
| **Permanence** | Ephemeral social content | Permanent portfolio pieces |

---

## Role-Based Architecture

### User Roles Hierarchy

```
┌─────────────────────────────────────┐
│           All Users                 │
│  (profiles table)                   │
│  - Can post, comment, like          │
│  - Can join groups, events          │
│  - Can message, follow              │
└────────────────┬────────────────────┘
                 │
        ┌────────┴──────────┐
        │                   │
┌───────▼──────┐    ┌──────▼──────┐
│   Artists    │    │   Admins    │
│ (artist_     │    │ (is_admin   │
│  profiles)   │    │  flag)      │
│              │    │             │
│ - Upload     │    │ - Moderate  │
│ - Portfolio  │    │ - Verify    │
│ - Collections│    │ - Features  │
│ - Commissions│    │ - Analytics │
└──────────────┘    └─────────────┘
```

### Database Schema Updates

#### Profiles Table Enhancement

```sql
-- Add artist role flag to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_artist boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS artist_since timestamptz;

-- Create index for artist queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_artist
ON public.profiles(is_artist) WHERE is_artist = true;

-- Automatically set is_artist flag when artist_profile is created
CREATE OR REPLACE FUNCTION set_artist_flag()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET is_artist = true,
        artist_since = COALESCE(artist_since, NEW.created_at)
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_artist_profile_created
    AFTER INSERT ON public.artist_profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_artist_flag();
```

#### Role Check Functions

```typescript
// lib/roles.ts
import { createClient } from '@/lib/supabase/client';

export async function isArtist(userId?: string): Promise<boolean> {
  const supabase = createClient();

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) return false;

  const { data } = await supabase
    .from('profiles')
    .select('is_artist')
    .eq('id', userId)
    .single();

  return data?.is_artist ?? false;
}

export async function getArtistProfile(userId?: string) {
  const supabase = createClient();

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) return null;

  const { data } = await supabase
    .from('artist_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data;
}

export interface UserRoles {
  isArtist: boolean;
  isAdmin: boolean;
  artistProfile: any | null;
}

export async function getUserRoles(userId?: string): Promise<UserRoles> {
  const supabase = createClient();

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) return { isArtist: false, isAdmin: false, artistProfile: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_artist, is_admin')
    .eq('id', userId)
    .single();

  const { data: artistProfile } = await supabase
    .from('artist_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return {
    isArtist: profile?.is_artist ?? false,
    isAdmin: profile?.is_admin ?? false,
    artistProfile,
  };
}
```

---

## Content Architecture

### Content Types Overview

Velvet Galaxy now supports three distinct content types:

#### 1. Regular Posts (Social Content)
**Location:** `posts` table
**Purpose:** Personal updates, thoughts, casual sharing
**Discovery:** Feed, following, groups
**Lifespan:** Ephemeral social content

#### 2. Media Gallery (Personal Media)
**Location:** `media` table
**Purpose:** Personal photos, videos, writings
**Discovery:** User profile gallery
**Lifespan:** Personal archives

#### 3. Artist Showcase (Professional Content)
**Location:** `artworks` table
**Purpose:** Professional portfolio, promotion, commissions
**Discovery:** Artist directory, curated galleries
**Lifespan:** Permanent portfolio pieces

### Content Relationship Diagram

```
┌──────────────────────────────────────────────────────┐
│                    User Profile                      │
│  (@username, display_name, avatar, bio)              │
└───────────┬────────────────────────┬─────────────────┘
            │                        │
            │                        │
    ┌───────▼────────┐      ┌───────▼────────────────┐
    │  Social Feed   │      │  Artist Profile        │
    │                │      │  (Optional)            │
    │  ┌──────────┐  │      │                        │
    │  │  Posts   │  │      │  ┌──────────────────┐  │
    │  │  - Text  │  │      │  │   Artworks       │  │
    │  │  - Images│  │      │  │   - Images       │  │
    │  │  - Videos│  │      │  │   - Animations   │  │
    │  │  - Polls │  │      │  │   - Comics       │  │
    │  │  - Audio │  │      │  │   - Videos       │  │
    │  └──────────┘  │      │  │   + Metadata     │  │
    │                │      │  │   + Pricing      │  │
    │  ┌──────────┐  │      │  │   + Techniques   │  │
    │  │  Media   │  │      │  └──────────────────┘  │
    │  │ Gallery  │  │      │                        │
    │  └──────────┘  │      │  ┌──────────────────┐  │
    │                │      │  │   Collections    │  │
    │  ┌──────────┐  │      │  │   - Series       │  │
    │  │ Activity │  │      │  │   - Portfolios   │  │
    │  │   Feed   │  │      │  └──────────────────┘  │
    │  └──────────┘  │      │                        │
    └────────────────┘      │  ┌──────────────────┐  │
                            │  │   Commissions    │  │
                            │  │   - Requests     │  │
                            │  │   - Status       │  │
                            │  │   - Terms        │  │
                            │  └──────────────────┘  │
                            └────────────────────────┘
```

### Content Cross-Posting

Artists may want to share their artwork in both places:

```typescript
// When creating artwork, optionally create a post
async function publishArtwork(artwork: Artwork, options: {
  shareToFeed?: boolean;
  shareToGroups?: string[];
  shareAsPromotion?: boolean;
}) {
  const supabase = createClient();

  // 1. Create artwork in artist showcase
  const { data: newArtwork } = await supabase
    .from('artworks')
    .insert(artwork)
    .select()
    .single();

  // 2. Optionally share to social feed
  if (options.shareToFeed) {
    await supabase.from('posts').insert({
      author_id: artwork.artist_id,
      content: `Check out my new artwork: ${artwork.title}\n\n${artwork.description}`,
      media_url: artwork.media_url,
      media_type: artwork.media_type === 'image' ? 'image' : 'video',
      is_promotional: true, // Flag as promotional
      artwork_id: newArtwork.id, // Link to artwork
      content_rating: artwork.content_rating,
    });
  }

  // 3. Share to selected groups
  if (options.shareToGroups?.length) {
    for (const groupId of options.shareToGroups) {
      await supabase.from('posts').insert({
        author_id: artwork.artist_id,
        content: `New artwork in my portfolio: ${artwork.title}`,
        media_url: artwork.media_url,
        media_type: artwork.media_type,
        is_promotional: true,
        artwork_id: newArtwork.id,
        // Group association logic here
      });
    }
  }

  return newArtwork;
}
```

### Enhanced Posts Table

```sql
-- Add promotional and artwork linking to posts
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS is_promotional boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS artwork_id uuid REFERENCES public.artworks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_posts_artwork_id ON public.posts(artwork_id);
CREATE INDEX IF NOT EXISTS idx_posts_promotional ON public.posts(is_promotional);

COMMENT ON COLUMN public.posts.is_promotional IS
  'Indicates if this post is promotional content (e.g., artist showcasing work)';
COMMENT ON COLUMN public.posts.artwork_id IS
  'Links to an artwork in the artist showcase if this post is sharing artwork';
```

---

## User Flows

### 1. Becoming an Artist

```
┌──────────────────────────────────────────┐
│  Regular User                            │
└────────────┬─────────────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Clicks "Become an  │
    │     Artist"        │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │ Creates Artist     │
    │ Profile Form       │
    │ - Artist name      │
    │ - Bio             │
    │ - Specialties     │
    │ - Commission info │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │ Trigger sets       │
    │ is_artist = true   │
    │ in profiles        │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │ Artist Dashboard   │
    │ - Upload artwork   │
    │ - Manage portfolio │
    │ - View analytics   │
    └────────────────────┘
```

### 2. Content Creation Flow for Artists

```
Artist has two paths for sharing content:

Path A: Regular Social Post
┌─────────────────┐
│ Create Post     │ → Regular feed post
│ - Quick share   │   - Shows in followers' feeds
│ - Casual update │   - Standard engagement
└─────────────────┘   - Ephemeral

Path B: Artist Showcase
┌─────────────────┐
│ Upload Artwork  │ → Professional portfolio
│ - Full metadata │   - Shows in artist gallery
│ - Pricing       │   - Searchable/browsable
│ - Collection    │   - Permanent
│ + Optional:     │
│   Share to feed │ → Creates promotional post
└─────────────────┘   - Links to artwork
                      - Tagged as promotional
```

### 3. Discovery Flows

#### For Regular Social Content
```
User → Feed → See friend's post → Engage
User → Profile → View activity → See posts
User → Search → Find posts → Engage
```

#### For Artist Content
```
User → Artists Hub → Browse galleries → View artwork → Commission
User → Search by medium → Filter by style → Discover artist
User → Artist Profile → Portfolio → Collections → Follow
Feed → See promotional post → Click artwork link → Artist gallery
```

---

## Integration Points

### 1. Profile Page Integration

**Regular User Profile:**
```
┌─────────────────────────────────────┐
│  @username                          │
│  Avatar | Display Name              │
│  Bio                                │
├─────────────────────────────────────┤
│  [Posts] [Media] [Activity]         │
├─────────────────────────────────────┤
│  Recent posts...                    │
└─────────────────────────────────────┘
```

**Artist Profile:**
```
┌─────────────────────────────────────┐
│  @username          [✓ Artist]      │
│  Avatar | Display Name              │
│  Bio                                │
├─────────────────────────────────────┤
│  [Posts] [Media] [Portfolio] 🎨     │
├─────────────────────────────────────┤
│  [View Full Artist Profile] →       │
│                                     │
│  Featured Artworks (3-6 preview)    │
│  ┌───┐ ┌───┐ ┌───┐                 │
│  │ 1 │ │ 2 │ │ 3 │                 │
│  └───┘ └───┘ └───┘                 │
│                                     │
│  Recent posts...                    │
└─────────────────────────────────────┘
```

### 2. Navigation Integration

**For All Users:**
- Home / Feed
- Discovery
- **Artists** ← New section
- Messages
- Marketplace

**For Artists (Additional Links):**
- "My Artist Profile" in user dropdown
- "Upload Artwork" quick action
- "Artist Dashboard" link

### 3. Feed Integration

Posts with `is_promotional = true` and `artwork_id`:

```
┌──────────────────────────────────────┐
│ @artist_name · 2h  [Promotional] 🎨 │
├──────────────────────────────────────┤
│ Check out my new artwork!            │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ │      [Artwork Image]             │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ "Sunset Dreams" - Digital Painting   │
│ Commission: Open                     │
│ [View in Gallery →]                  │
│                                      │
│ ❤️ 45  💬 8  🔗 Share               │
└──────────────────────────────────────┘
```

### 4. Search Integration

Enhanced search with artist filter:

```
Search: "fantasy art"

Filters:
[ ] Posts
[x] Artworks
[ ] Artists
[ ] Groups

Medium: [Digital ▼]
Style: [Fantasy ▼]
Rating: [All ▼]
```

---

## Implementation Strategy

### Phase 1: Role Infrastructure ✅ (Completed)
- [x] Create artist_profiles table
- [x] Create artworks table
- [x] Create collections system
- [x] Basic RLS policies

### Phase 2: Role Integration (Current Phase)
- [ ] Add is_artist flag to profiles
- [ ] Create role check functions
- [ ] Add artist_since timestamp
- [ ] Update TypeScript types

### Phase 3: Content Integration
- [ ] Add is_promotional to posts
- [ ] Add artwork_id to posts
- [ ] Create cross-posting system
- [ ] Update feed to show promotional badges

### Phase 4: UI/UX Integration
- [ ] Add "Become an Artist" onboarding
- [ ] Add portfolio tab to profiles
- [ ] Artist badge/indicator
- [ ] Upload artwork interface
- [ ] Artist dashboard

### Phase 5: Discovery & Promotion
- [ ] Artist directory
- [ ] Featured artists system
- [ ] Search integration
- [ ] Trending artworks
- [ ] Commission marketplace

### Migration Script

```sql
-- Migration 053: Artist Role Integration
-- Adds artist role flags and promotional content support

-- Add artist flags to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_artist boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS artist_since timestamptz;

-- Add promotional flags to posts
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS is_promotional boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS artwork_id uuid REFERENCES public.artworks(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_is_artist
ON public.profiles(is_artist) WHERE is_artist = true;

CREATE INDEX IF NOT EXISTS idx_posts_artwork_id
ON public.posts(artwork_id) WHERE artwork_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_promotional
ON public.posts(is_promotional) WHERE is_promotional = true;

-- Set is_artist for existing artist profiles
UPDATE public.profiles
SET is_artist = true,
    artist_since = artist_profiles.created_at
FROM public.artist_profiles
WHERE profiles.id = artist_profiles.user_id;

-- Create trigger for new artist profiles
CREATE OR REPLACE FUNCTION set_artist_flag()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET is_artist = true,
        artist_since = COALESCE(artist_since, NEW.created_at)
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_artist_profile_created
    AFTER INSERT ON public.artist_profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_artist_flag();

-- Comments
COMMENT ON COLUMN public.profiles.is_artist IS
  'Flag indicating if user has an artist profile and enhanced capabilities';
COMMENT ON COLUMN public.profiles.artist_since IS
  'Timestamp when user became an artist';
COMMENT ON COLUMN public.posts.is_promotional IS
  'Indicates if this post is promotional content (e.g., artist showcasing work)';
COMMENT ON COLUMN public.posts.artwork_id IS
  'Links to an artwork in the artist showcase if this post is sharing artwork';

-- Record migration
INSERT INTO public.migrations (name, executed_at)
VALUES ('053_artist_role_integration', now())
ON CONFLICT (name) DO NOTHING;
```

---

## Benefits of This Architecture

### 1. **Clear Separation of Concerns**
- Social content vs professional portfolio
- Different discovery mechanisms
- Different engagement patterns

### 2. **Flexible Content Strategy**
- Artists can share casually in feed
- Artists can showcase professionally in portfolio
- Artists can cross-promote between both

### 3. **User Choice**
- Users opt-in to being artists
- Artists choose what to showcase vs share
- Viewers can follow social OR portfolio

### 4. **Scalability**
- Artist content can be optimized separately
- Can add artist-specific features without affecting social features
- Can monetize artist features independently

### 5. **Discoverability**
- Artist directory is browse-optimized
- Social feed is relationship-optimized
- Each serves its purpose

### 6. **Future Extensibility**
- Can add more roles (e.g., "Merchant", "Educator")
- Can add role-specific features
- Can create role-based monetization

---

## Frequently Asked Questions

### Q: Can non-artists post images?
**A:** Yes! Regular users can post images in the social feed. The difference is:
- Social posts: Casual sharing, shows in followers' feeds
- Artworks: Professional portfolio, shows in artist galleries

### Q: Can artists disable their artist profile?
**A:** Yes, but it will hide their portfolio. Their `is_artist` flag remains for historical tracking.

### Q: What if someone shares an artwork as a regular post?
**A:** That's fine! The artwork still exists in their portfolio. The post is just a social share of it.

### Q: How do promotional posts appear in the feed?
**A:** They have a "Promotional" badge and link to the full artwork page. Users can choose to hide promotional content in feed settings (future feature).

### Q: Can artists have commissions closed?
**A:** Yes, commission_status can be "open", "closed", or "waitlist". This is independent of their artist profile being active.

---

## Summary

The Artists Showcase integrates with Velvet Galaxy as an **opt-in role system** that gives users enhanced portfolio and promotional capabilities while maintaining their regular social presence. Content is clearly separated between casual social sharing and professional promotion, with flexible cross-posting options. This architecture provides clear value to both artists (promotion) and viewers (curated discovery) while maintaining the social nature of the platform.

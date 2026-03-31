# Artists Showcase Implementation

## Overview

A comprehensive artists showcase system has been added to Velvet Galaxy, enabling creators to share their artwork, comics, animations, and other creative works with the community.

**🎨 Important Architectural Decision:** Artists are an **opt-in role** in Velvet Galaxy. Any user can become an artist by creating an artist profile, which grants them access to specialized portfolio, collection, and commission features. Artist content is explicitly **promotional** and distinct from regular social posts, allowing for optimized discovery and professional presentation.

**📚 For Complete Architecture Details:** See [`docs/ARTIST_ARCHITECTURE.md`](docs/ARTIST_ARCHITECTURE.md) for:
- Role-based architecture and integration strategy
- Content architecture (social vs promotional)
- User flows and discovery mechanisms
- Cross-posting strategies
- Implementation phases

## Features Implemented

### 1. Database Schema (Migration 052)

**Tables Created:**
- `artist_profiles` - Extended artist information and commission settings
- `artworks` - Individual artwork items with media, tags, and metadata
- `art_collections` - Collections/series of related artworks
- `art_collection_items` - Mapping of artworks to collections
- `artwork_likes` - Like/appreciation system
- `artwork_comments` - Comment system with nested replies support
- `commission_requests` - Commission request and management system

**Key Features:**
- Full Row Level Security (RLS) policies for privacy
- Visibility controls (public, followers, private)
- Content rating system (SFW, NSFW, Explicit)
- Commission status tracking (open, closed, waitlist)
- View counting and engagement metrics
- Support for multiple media types (image, animation, comic, video)
- Tag-based categorization and filtering
- Medium tracking (digital, traditional, 3D, etc.)

**Helper Views:**
- `artworks_with_stats` - Artworks with like/comment counts
- `artist_profiles_with_stats` - Artist profiles with engagement metrics

### 2. TypeScript Types

**File:** `types/artwork.ts`

**Types Defined:**
- `ArtistProfile` - Artist profile data
- `ArtistProfileWithStats` - Profile with engagement statistics
- `Artwork` - Artwork item with all metadata
- `ArtworkWithStats` - Artwork with engagement metrics
- `ArtCollection` - Collection/series of artworks
- `ArtworkComment` - Comments with nested reply support
- `ArtworkLike` - Like/appreciation records
- `CommissionRequest` - Commission request data
- `ArtworkFilters` - Filter options for browsing

**Constants:**
- `ART_MEDIUMS` - Common art mediums (digital, traditional, watercolor, etc.)
- `ART_SPECIALTIES` - Artist specialties (character design, comics, animation, etc.)
- `COMMON_ART_TAGS` - Common tags for artwork categorization

### 3. Pages Created

#### `/app/artists/page.tsx` - Main Artists Hub
- Hero section with call-to-action
- Statistics dashboard (artists, artworks, likes)
- Featured artists showcase
- Recent and trending artworks tabs
- Browse by medium categories
- Artist onboarding CTA

#### `/app/artists/browse/page.tsx` - Browse & Filter
- Client-side filtering and search
- Toggle between artworks and artists view
- Filter by medium, tags, content rating
- Sort by recent, popular, views, likes
- Responsive filter sheet with active filter indicators
- Real-time search functionality

### 4. Components Created

#### `components/artwork-gallery.tsx`
- Responsive masonry-style artwork grid
- Configurable columns (2, 3, or 4)
- Hover effects with engagement metrics
- Media type indicators (video/animation)
- Content rating badges
- Commission badges
- Artist attribution
- Tag display
- Image optimization and error handling

#### `components/artist-grid.tsx`
- Artist profile cards with avatars
- Verified and featured badges
- Commission status indicators
- Engagement statistics (artworks, followers, views)
- Specialties display
- "View Portfolio" CTA buttons
- Responsive grid layout

### 5. Navigation Integration

**Updated:** `components/navigation.tsx`
- Added "Artists" navigation item with Palette icon
- Royal orange color theming
- Positioned between Discovery and Messages
- Active state highlighting

## Database Schema Details

### Artist Profiles
```sql
- artist_name (can differ from display_name)
- bio
- specialties (array of specialization areas)
- commission_status (open/closed/waitlist)
- commission_info (terms, pricing)
- portfolio_url
- social_links (JSONB for flexibility)
- is_featured (for homepage showcase)
- is_verified (verified artist badge)
```

### Artworks
```sql
- title, description
- media_type (image/animation/comic/video)
- media_url, thumbnail_url
- dimensions (width, height)
- duration (for animations/videos)
- tags (array for categorization)
- medium (digital, traditional, etc.)
- software_used (array)
- content_rating (sfw/nsfw/explicit)
- visibility (public/followers/private)
- view_count, is_featured
```

### Collections
```sql
- title, description
- cover_image_url
- is_series (for sequential works like comics)
- visibility controls
- position-based ordering for items
```

## Security & Privacy

**Row Level Security Policies:**
- Public artworks viewable by everyone
- Followers-only artworks visible to followers
- Private artworks only visible to artist
- Users can only modify their own content
- Commission requests visible only to artist and client
- Proper authentication checks on all operations

## User Flows

### Browsing Artworks
1. Navigate to `/artists`
2. Browse featured artists and recent/trending artworks
3. Click "Browse Artworks" or category to filter
4. Use filters to refine by medium, tags, rating
5. Click artwork to view details (to be implemented)

### Becoming an Artist
1. Click "Become an Artist" button
2. Create artist profile (to be implemented)
3. Upload artworks (to be implemented)
4. Organize into collections (to be implemented)
5. Enable commissions if desired (to be implemented)

### Commission Workflow
1. Client browses artists with open commissions
2. Submit commission request with details
3. Artist reviews and accepts/declines
4. Status tracking through completion
5. Final artwork delivery

## Next Steps (To Be Implemented)

### High Priority
1. **Artist Profile Page** (`/artists/profile/[userId]`)
   - Portfolio grid view
   - Collection/series tabs
   - Artist bio and information
   - Follow/unfollow button
   - Commission request button
   - Social links

2. **Artwork Detail Page** (`/artists/artwork/[artworkId]`)
   - Full-size artwork viewer
   - Title, description, metadata
   - Comment section with nested replies
   - Like/appreciate button
   - Share functionality
   - Related artworks
   - Artist attribution

3. **Artwork Upload Interface** (`/artists/upload`)
   - Multi-file upload with drag-and-drop
   - Title, description, tags input
   - Medium and software selection
   - Content rating selection
   - Visibility controls
   - Add to collection option
   - Preview before publishing

4. **Become an Artist Page** (`/artists/become`)
   - Artist profile creation form
   - Artist name, bio, specialties
   - Commission settings
   - Portfolio URL and social links
   - Welcome guide and tips

5. **Artist Dashboard** (`/artists/dashboard`)
   - Artwork management (edit, delete)
   - Collection management
   - Analytics (views, likes, comments)
   - Commission request inbox
   - Follower growth tracking

### Medium Priority
6. **Collection Management**
   - Create/edit/delete collections
   - Add/remove artworks
   - Reorder items in series
   - Collection cover image
   - Visibility settings

7. **Commission System**
   - Commission request form
   - Request management dashboard
   - Status updates
   - Client communication
   - Terms and pricing editor

8. **Search & Discovery Enhancements**
   - Advanced search with multiple filters
   - Artist recommendations
   - Similar artwork suggestions
   - Popular tags/trends
   - "New Artists" section

### Lower Priority
9. **Social Features**
   - Follow artists
   - Artwork shares
   - Activity feed integration
   - Artist mentions in posts

10. **Advanced Features**
    - Artwork downloads (with artist permission)
    - Watermark options
    - Print shop integration
    - Artist collaborations
    - Portfolio themes/customization
    - Art challenges and contests

## File Structure

```
app/
├── artists/
│   ├── page.tsx                    # Main artists hub
│   ├── browse/
│   │   └── page.tsx               # Browse with filters
│   ├── profile/
│   │   └── [userId]/
│   │       └── page.tsx           # (To implement)
│   ├── artwork/
│   │   └── [artworkId]/
│   │       └── page.tsx           # (To implement)
│   ├── upload/
│   │   └── page.tsx               # (To implement)
│   ├── become/
│   │   └── page.tsx               # (To implement)
│   └── dashboard/
│       └── page.tsx               # (To implement)

components/
├── artwork-gallery.tsx            # Artwork grid component
├── artist-grid.tsx                # Artist card grid
└── navigation.tsx                 # Updated with Artists link

types/
└── artwork.ts                     # All artwork-related types

scripts/
└── 052_create_artists_showcase.sql # Database migration
```

## Role Integration (Migration 053)

### New Features

**Profiles Table Enhancement:**
- `is_artist` boolean flag - Indicates user has artist capabilities
- `artist_since` timestamp - When user became an artist

**Posts Table Enhancement:**
- `is_promotional` boolean flag - Marks post as promotional content
- `artwork_id` uuid - Links social post to artwork in showcase

**Automatic Triggers:**
- Setting `is_artist = true` when artist profile is created
- Validating artwork links in promotional posts
- Ensuring post author is artwork artist

**Helper Functions & Views:**
- `is_user_artist(user_id)` - Check if user is an artist
- `get_user_artist_profile(user_id)` - Get artist profile for user
- `promotional_posts_with_artwork` - View of promotional posts with artwork details
- `artists_with_profiles` - Artist profiles with full user details
- `artist_full_engagement_metrics` - Comprehensive engagement analytics

**TypeScript Utilities (lib/roles.ts):**
- `isArtist(userId?)` - Client-side artist check
- `isArtistServer(userId?)` - Server-side artist check
- `isAdmin(userId?)` - Admin role check
- `getUserRoles(userId?)` - Get all roles at once
- `getArtistProfile(userId?)` - Retrieve artist profile
- `useUserRoles()` - React hook for role access
- `requireArtist()` - Guard function for artist-only pages
- `requireAdmin()` - Guard function for admin-only pages

### Installation Instructions

### 1. Run Both Database Migrations (in order)

```bash
# Option A: Supabase Dashboard (Recommended)
# 1. Go to Supabase Dashboard → SQL Editor
# 2. First, copy and execute scripts/052_create_artists_showcase.sql
# 3. Then, copy and execute scripts/053_artist_role_integration.sql

# Option B: Command line
# Ensure you have database connection configured
psql $DATABASE_URL -f scripts/052_create_artists_showcase.sql
psql $DATABASE_URL -f scripts/053_artist_role_integration.sql
```

**Migration 052** creates the artist showcase tables (artworks, collections, etc.)
**Migration 053** integrates the artist role with profiles and posts

### 2. Verify Migration

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%artist%' OR table_name LIKE '%artwork%';

-- Check views exist
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE '%artist%';
```

### 3. Test the Implementation

1. Navigate to `/artists` in your application
2. Verify the page loads without errors
3. Check `/artists/browse` for filtering functionality
4. Verify navigation shows "Artists" link

## Usage Examples

### Creating an Artist Profile (Manual)

```typescript
const supabase = createClient();

const { data, error } = await supabase
  .from('artist_profiles')
  .insert({
    user_id: userId,
    artist_name: 'Creative Artist',
    bio: 'Digital artist specializing in character design',
    specialties: ['character design', 'digital painting'],
    commission_status: 'open',
    commission_info: 'Commissions starting at $50...',
  });
```

### Uploading Artwork (Manual)

```typescript
const { data, error } = await supabase
  .from('artworks')
  .insert({
    artist_id: userId,
    title: 'My Artwork',
    description: 'A beautiful piece...',
    media_type: 'image',
    media_url: 'https://...',
    thumbnail_url: 'https://...',
    tags: ['portrait', 'fantasy', 'original'],
    medium: 'digital',
    content_rating: 'sfw',
    visibility: 'public',
  });
```

### Querying Artworks with Stats

```typescript
const { data } = await supabase
  .from('artworks_with_stats')
  .select(`
    *,
    artist:profiles!artworks_artist_id_fkey(*)
  `)
  .eq('visibility', 'public')
  .order('like_count', { ascending: false })
  .limit(20);
```

## Performance Considerations

- **Indexes:** All critical columns indexed (artist_id, created_at, tags, etc.)
- **Views:** Pre-aggregated stats views for efficient queries
- **Pagination:** Implement for large result sets (50 items per page recommended)
- **Image Optimization:** Use thumbnail_url for grid views, full media_url for detail pages
- **Caching:** Consider caching featured artists and trending artworks

## Testing Checklist

- [ ] Run migration successfully
- [ ] Create test artist profile
- [ ] Upload test artworks
- [ ] Verify RLS policies work correctly
- [ ] Test public/followers/private visibility
- [ ] Test filtering by medium, tags, rating
- [ ] Test sorting options
- [ ] Verify artist and artwork stats calculate correctly
- [ ] Test on mobile devices
- [ ] Verify navigation integration

## Success Metrics

Track these metrics to measure feature success:
- Number of artist profiles created
- Total artworks uploaded
- Artwork views and engagement
- Commission requests submitted
- User retention for artists
- Time spent browsing artworks
- Search and filter usage

## Conclusion

The Artists Showcase is now integrated into Velvet Galaxy, providing a foundation for creators to share their work. The core infrastructure is complete, with clear paths forward for additional features like detailed artwork pages, upload interfaces, and commission management.

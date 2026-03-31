import type { UserProfile } from './user';

/**
 * Commission status for artists
 */
export type CommissionStatus = 'open' | 'closed' | 'waitlist';

/**
 * Artwork media types
 */
export type ArtworkMediaType = 'image' | 'animation' | 'comic' | 'video';

/**
 * Content rating for artworks
 */
export type ArtworkContentRating = 'sfw' | 'nsfw' | 'explicit';

/**
 * Visibility settings for artworks and collections
 */
export type ArtworkVisibility = 'public' | 'followers' | 'private';

/**
 * Commission request status
 */
export type CommissionRequestStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'declined' | 'cancelled';

/**
 * Artist profile - extended information for users showcasing art
 */
export interface ArtistProfile {
  id: string;
  user_id: string;
  artist_name: string | null;
  bio: string | null;
  specialties: string[];
  commission_status: CommissionStatus;
  commission_info: string | null;
  portfolio_url: string | null;
  social_links: Record<string, string>;
  is_featured: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  profile?: UserProfile;
}

/**
 * Artist profile with engagement statistics
 */
export interface ArtistProfileWithStats extends ArtistProfile {
  artwork_count: number;
  collection_count: number;
  total_views: number;
  follower_count: number;
}

/**
 * Artwork item
 */
export interface Artwork {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  media_type: ArtworkMediaType;
  media_url: string;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  file_size: number | null;
  tags: string[];
  medium: string | null;
  software_used: string[];
  content_rating: ArtworkContentRating;
  is_mature: boolean;
  is_commission: boolean;
  is_featured: boolean;
  view_count: number;
  visibility: ArtworkVisibility;
  created_at: string;
  updated_at: string;
  // Joined data
  artist?: UserProfile;
  artist_profile?: ArtistProfile;
}

/**
 * Artwork with engagement statistics
 */
export interface ArtworkWithStats extends Artwork {
  like_count: number;
  comment_count: number;
  is_liked_by_user?: boolean;
}

/**
 * Art collection/series
 */
export interface ArtCollection {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_series: boolean;
  visibility: ArtworkVisibility;
  created_at: string;
  updated_at: string;
  // Joined data
  artist?: UserProfile;
  artworks?: Artwork[];
  artwork_count?: number;
}

/**
 * Collection item mapping
 */
export interface ArtCollectionItem {
  collection_id: string;
  artwork_id: string;
  position: number;
  // Joined data
  artwork?: Artwork;
}

/**
 * Artwork like
 */
export interface ArtworkLike {
  user_id: string;
  artwork_id: string;
  created_at: string;
  // Joined data
  user?: UserProfile;
}

/**
 * Artwork comment
 */
export interface ArtworkComment {
  id: string;
  artwork_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: UserProfile;
  replies?: ArtworkComment[];
}

/**
 * Commission request
 */
export interface CommissionRequest {
  id: string;
  artist_id: string;
  client_id: string;
  title: string;
  description: string;
  reference_images: string[];
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: CommissionRequestStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  artist?: UserProfile;
  client?: UserProfile;
}

/**
 * Artwork filter options
 */
export interface ArtworkFilters {
  media_type?: ArtworkMediaType | ArtworkMediaType[];
  medium?: string | string[];
  tags?: string[];
  content_rating?: ArtworkContentRating | ArtworkContentRating[];
  is_mature?: boolean;
  is_commission?: boolean;
  artist_id?: string;
  sort_by?: 'recent' | 'popular' | 'views' | 'likes';
  search?: string;
}

/**
 * Common art mediums for filtering
 */
export const ART_MEDIUMS = [
  'digital',
  'traditional',
  'watercolor',
  'oil',
  'acrylic',
  'pencil',
  'ink',
  'charcoal',
  '3D',
  'pixel art',
  'vector',
  'mixed media',
] as const;

/**
 * Common art specialties
 */
export const ART_SPECIALTIES = [
  'digital painting',
  'traditional art',
  'character design',
  'concept art',
  'comics',
  'manga',
  'animation',
  '3D modeling',
  'pixel art',
  'vector art',
  'illustration',
  'environment design',
  'creature design',
  'portrait',
  'landscape',
] as const;

/**
 * Common art tags
 */
export const COMMON_ART_TAGS = [
  'portrait',
  'landscape',
  'character',
  'creature',
  'environment',
  'concept',
  'fanart',
  'original',
  'sketch',
  'lineart',
  'colored',
  'shaded',
  'commission',
  'personal',
  'study',
  'wip',
] as const;

/**
 * Type guard to check if an object is a valid Artwork
 */
export function isArtwork(item: any): item is Artwork {
  return (
    item &&
    typeof item.id === 'string' &&
    typeof item.artist_id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.media_url === 'string' &&
    ['image', 'animation', 'comic', 'video'].includes(item.media_type)
  );
}

/**
 * Type guard to check if an object is a valid ArtistProfile
 */
export function isArtistProfile(item: any): item is ArtistProfile {
  return (
    item &&
    typeof item.id === 'string' &&
    typeof item.user_id === 'string' &&
    ['open', 'closed', 'waitlist'].includes(item.commission_status)
  );
}

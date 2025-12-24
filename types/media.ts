import type {UserProfile} from './user';

/**
 * Type representing the different media types in the system
 */
export type MediaType = 'writing' | 'audio' | 'picture' | 'video';

/**
 * Interface representing a media item in the system
 */
export interface MediaItem {
    id: string;  // UUID
    album_id?: string | null;  // UUID, optional
    user_id: string;  // UUID
    title: string;
    description: string | null;
    media_type: MediaType;
    media_url: string | null;
    message_id?: string | null; // UUID, optional
    content: string | null;  // For text/writing content
    thumbnail_url: string | null;
    created_at: string;  // ISO date string
    updated_at: string;  // ISO date string
    author_profile?: UserProfile;  // Added this line for the joined profile
    width?: number;
    height?: number;
    duration?: number;
    alt_text?: string;
}

/**
 * Type guard to check if an object is a valid MediaItem
 */
export function isMediaItem(item: any): item is MediaItem {
    return (
        item &&
        typeof item.id === 'string' &&
        typeof item.user_id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.media_type === 'string' &&
        ['writing', 'audio', 'picture', 'video'].includes(item.media_type) &&
        (item.album_id === null || typeof item.album_id === 'string') &&
        (item.description === null || typeof item.description === 'string') &&
        (item.media_url === null || typeof item.media_url === 'string') &&
        (item.content === null || typeof item.content === 'string') &&
        (item.thumbnail_url === null || typeof item.thumbnail_url === 'string') &&
        typeof item.created_at === 'string' &&
        typeof item.updated_at === 'string'
    );
}

/**
 * Helper type to extract media items of a specific type
 */
export type MediaItemsByType<T extends MediaType> = MediaItem & { media_type: T };

import type {UserProfile} from "./user";

/**
 * Type representing the different media types in the system
 */
export type ActivityType =
    'like'
    | 'comment'
    | 'follow'
    | 'post'
    | 'mention'
    | 'share'
    | 'reaction'
    | 'join_group'
    | 'event_rsvp'
    | string; // Allow for custom activity types
/**
 * Represents an activity in the system (likes, comments, follows, etc.)
 */
export interface Activity {
    id: string;
    user_id: string;
    activity_type: ActivityType
    target_id: string | null;
    target_type: string | null; // e.g., 'post', 'comment', 'user', 'group', 'event'
    metadata: {
        // Common metadata fields
        content?: string;
        count?: number;
        // Add other metadata fields as needed
        [key: string]: unknown;
    };
    created_at: string;
    updated_at?: string;
    author_profile?: UserProfile; // The user who performed the activity
}

/**
 * Extended activity type for UI components that includes author information
 */
export interface ActivityWithAuthor extends Activity {
    author_profile: UserProfile;
}

/**
 * Type for activity feed response, which may be paginated
 */
export interface ActivityFeedResponse {
    data: ActivityWithAuthor[];
    hasMore: boolean;
    lastCursor?: string;
}

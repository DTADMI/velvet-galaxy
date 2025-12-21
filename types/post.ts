/**
 * Post and Comment related types
 */

import type {MediaItem} from "@/types/media";

import type {UserProfile} from "./user";

export interface PollOption {
    id: string;
    index: number;
    text: string;
    votes_count?: number;
    voted?: boolean;
}

/**
 * Unified Post shape used across the app. Some fields are optional because
 * different queries/pages select different subsets.
 */
export interface Post {
    id: string;
    user_id?: string;
    author_id?: string; // Some code refers to author_id

    // Core content
    content: string;
    title?: string;
    description?: string | null;
    content_rating?: string;
    visibility?: string;
    is_promotional?: boolean;

    // Media
    media_type?: string | null; // Keep as string to match DB union and usages
    media_url?: string | null;
    images?: string[] | null;
    audio_url?: string | null;
    thumbnail_url?: string | null;
    content_type?: string; // legacy/compat

    // Relations/denormalized
    author_profile: UserProfile;

    // Timestamps
    created_at: string;
    updated_at?: string;

    // Metrics/state
    likes_count?: number;
    comments_count?: number;
    is_liked?: boolean;

    // Polls
    poll_question?: string | null;
    poll_options?: Array<PollOption> | null;
    poll_multiple_choice?: boolean | null;
    poll_end_date?: string | null;

    // Attachments/extra
    album_id?: string | null;
    media_items?: Array<MediaItem>;
    tags?: string[];
    width?: number;
    height?: number;
    duration?: number;
    alt_text?: string;
}

export interface Comment {
    id: string;
    content: string;
    post_id: string;
    author_id: string;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
    author?: UserProfile;
    replies?: Comment[];
    likes_count?: number;
    is_liked?: boolean;
}

export interface PostWithDetails extends Post {
    comments: Comment[];
    // Add other related data as needed
}

export interface CreatePostInput {
    content: string;
    author_id: string;
    media_ids?: string[];
    tags?: string[];
    // Add other fields as needed
}

export interface UpdatePostInput {
    id: string;
    content?: string;
    // Add other updatable fields
}

export interface Like {
    id: string;
    user_id: string;
    post_id: string;
    created_at: string;
    user?: UserProfile;
}

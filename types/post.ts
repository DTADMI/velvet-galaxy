/**
 * Post and Comment related types
 */

import type {UserProfile} from "./user";
import {MediaItem} from "@/types/media";

export interface PollOption {
    id: string;
    index: number;
    text: string;
    votes_count?: number;
    voted?: boolean;
}

export interface Post {
    id: string;
    author_id: string;
    content: string;
    images?: string[] | null
    created_at: string;
    updated_at: string;
    likes_count?: number;
    comments_count?: number;
    is_liked?: boolean;
    author_profile: UserProfile;
    content_rating?: string;
    media_type?: string | null;
    media_url?: string | null;
    audio_url?: string | null;
    is_promotional?: boolean;
    visibility?: string;
    poll_question?: string | null;
    poll_options?: Array<PollOption> | null;
    poll_multiple_choice?: boolean | null;
    poll_end_date?: string | null;
    // Media attachments associated with the post
    media_items?: Array<MediaItem>;
    tags?: string[];
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

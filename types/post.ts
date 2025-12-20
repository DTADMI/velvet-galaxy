/**
 * Post and Comment related types
 */

import type {UserProfile} from "./user";

export interface Post {
    id: string;
    author_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    likes_count?: number;
    comments_count?: number;
    is_liked?: boolean;
    author?: UserProfile;
    // Media attachments associated with the post
    media_items?: Array<{
        id: string;
        media_type: 'image' | 'video' | 'audio' | 'document';
        url: string;
        width?: number;
        height?: number;
        duration?: number;
        thumbnail_url?: string;
        alt_text?: string;
        created_at: string;
    }>;
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

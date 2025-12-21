import type {Post} from "./post";

export interface Bookmark {
    id: string;
    user_id: string;
    post_id: string;
    created_at: string;
    post: Post & {
        content_rating: string;
        media_type: string | null;
        media_url: string | null;
        content_type?: string;
        is_promotional?: boolean;
    };
}

export interface BookmarkWithPost extends Omit<Bookmark, 'post'> {
    post: Post & {
        content_rating: string;
        media_type: string | null;
        media_url: string | null;
        content_type?: string;
        is_promotional?: boolean;
    };
}

export interface ContentFilters {
    image: boolean;
    video: boolean;
    audio: boolean;
    writing: boolean;
    text: boolean;
    promotional: boolean;
}

export const DEFAULT_CONTENT_FILTERS: ContentFilters = {
    image: true,
    video: true,
    audio: true,
    writing: true,
    text: true,
    promotional: true,
};

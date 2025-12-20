// Re-export all types for easier imports
export * from './user';
export * from './media';
export * from './chat';
export * from './post';
export * from './community';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// API response wrapper
export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

// Pagination types
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    };
}

// Search related types
// Using type references to avoid circular imports
export interface SearchResults {
    users: import('./user').UserProfile[];
    posts: import('./post').Post[];
    pictures: import('./media').MediaItem[];
    videos: import('./media').MediaItem[];
    audios: import('./media').MediaItem[];
    writings: import('./media').MediaItem[];
    events: import('./community').Event[];
    groups: import('./community').Group[];
}

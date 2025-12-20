/**
 * User and Profile related types
 */

export interface UserProfile {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface User extends UserProfile {
    email?: string;
    // Add other user-specific fields as needed
}

export interface Relationship {
    id: string;
    user_id: string;
    related_user_id: string;
    status: 'pending' | 'accepted' | 'rejected' | 'blocked';
    created_at: string;
    updated_at: string;
    profiles?: UserProfile;
}

export interface Friendship extends Relationship {
    // Additional friendship-specific fields can be added here
}

export interface Follow {
    id: string;
    follower_id: string;
    following_id: string;
    created_at: string;
    profiles?: UserProfile;
}

// For authentication responses
export interface AuthResponse {
    user: User | null;
    session: any | null;
    error: Error | null;
}

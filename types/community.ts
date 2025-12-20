/**
 * Community related types (Groups, Events, etc.)
 */

import type {UserProfile} from "./user";

// Group related types
export interface Group {
    id: string;
    name: string;
    description: string | null;
    avatar_url: string | null;
    banner_url: string | null;
    creator_id: string;
    is_private: boolean;
    created_at: string;
    updated_at: string;
    member_count?: number;
    is_member?: boolean;
    creator?: UserProfile;
    members?: GroupMember[];
}

export interface GroupMember {
    id: string;
    group_id: string;
    user_id: string;
    role: 'member' | 'moderator' | 'admin';
    status: 'pending' | 'accepted' | 'rejected' | 'banned';
    created_at: string;
    updated_at: string;
    user?: UserProfile;
}

// Event related types
export interface Event {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    starts_at: string;
    ends_at: string | null;
    creator_id: string;
    group_id: string | null;
    cover_url: string | null;
    is_online: boolean;
    max_attendees: number | null;
    created_at: string;
    updated_at: string;
    creator?: UserProfile;
    group?: Group;
    attendees?: EventAttendee[];
    attendee_count?: number;
    is_attending?: boolean;
}

export interface EventAttendee {
    id: string;
    event_id: string;
    user_id: string;
    status: 'going' | 'maybe' | 'not_going';
    created_at: string;
    updated_at: string;
    user?: UserProfile;
}

// Marketplace related types
export interface MarketplaceItem {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
    category: string;
    seller_id: string;
    status: 'available' | 'pending' | 'sold' | 'draft';
    location: string | null;
    created_at: string;
    updated_at: string;
    images: string[];
    seller?: UserProfile;
    // Add shipping, payment methods, etc. as needed
}

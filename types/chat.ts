/**
 * Chat and messaging related types
 */

import type {UserProfile} from "./user";

export interface Message {
    id: string;
    content: string;
    sender_id: string;
    conversation_id: string;
    created_at: string;
    updated_at: string;
    sender?: UserProfile;
    // Add other message properties as needed
}

export interface Conversation {
    id: string;
    type: 'direct' | 'group' | 'channel';
    name: string | null;
    created_at: string;
    updated_at: string;
    last_message?: Message;
    participants?: UserProfile[];
    is_pinned?: boolean;
    unread_count?: number;
}

export interface ChatRoom extends Conversation {
    // Additional chat room specific fields
    description?: string;
    avatar_url?: string | null;
    is_private?: boolean;
    created_by?: string;
}

export interface WaitingParticipant {
    id: string;
    user_id: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    user?: UserProfile;
}

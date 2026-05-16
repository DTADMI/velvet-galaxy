export const queryKeys = {
    profiles: {
        all: ["profiles"] as const,
        byId: (id: string) => ["profiles", id] as const,
        byIds: (ids: string[]) => ["profiles", "batch", ...ids] as const,
    },
    posts: {
        all: ["posts"] as const,
        byId: (id: string) => ["posts", id] as const,
        byFeed: (filters?: Record<string, string>) => ["posts", "feed", filters ?? {}] as const,
        byAuthor: (authorId: string) => ["posts", "author", authorId] as const,
        byGroup: (groupId: string) => ["posts", "group", groupId] as const,
        likes: (postId: string) => ["posts", postId, "likes"] as const,
        comments: (postId: string) => ["posts", postId, "comments"] as const,
    },
    messages: {
        all: ["messages"] as const,
        byConversation: (conversationId: string) => ["messages", "conversation", conversationId] as const,
        conversations: () => ["messages", "conversations"] as const,
    },
    notifications: {
        all: ["notifications"] as const,
        byUser: (userId: string) => ["notifications", userId] as const,
        unreadCount: (userId: string) => ["notifications", userId, "unread"] as const,
    },
    groups: {
        all: ["groups"] as const,
        byId: (id: string) => ["groups", id] as const,
        byUser: (userId: string) => ["groups", "user", userId] as const,
        members: (groupId: string) => ["groups", groupId, "members"] as const,
    },
    events: {
        all: ["events"] as const,
        byId: (id: string) => ["events", id] as const,
        attendees: (eventId: string) => ["events", eventId, "attendees"] as const,
    },
    follows: {
        followers: (userId: string) => ["follows", userId, "followers"] as const,
        following: (userId: string) => ["follows", userId, "following"] as const,
        isFollowing: (followerId: string, targetId: string) => ["follows", followerId, "isFollowing", targetId] as const,
    },
    friends: {
        all: (userId: string) => ["friends", userId] as const,
        status: (userId: string, friendId: string) => ["friends", userId, "status", friendId] as const,
    },
    bookmarks: {
        all: (userId: string) => ["bookmarks", userId] as const,
    },
    media: {
        byId: (mediaId: string) => ["media", mediaId] as const,
        byUser: (userId: string) => ["media", "user", userId] as const,
    },
    search: {
        results: (query: string, filters?: Record<string, string>) => ["search", query, filters ?? {}] as const,
    },
    marketplace: {
        all: ["marketplace"] as const,
        byId: (id: string) => ["marketplace", id] as const,
        byUser: (userId: string) => ["marketplace", "user", userId] as const,
    },
    admin: {
        health: () => ["admin", "health"] as const,
        stats: () => ["admin", "stats"] as const,
        auditLog: () => ["admin", "audit-log"] as const,
        aiCosts: () => ["admin", "ai-costs"] as const,
    },
} as const;

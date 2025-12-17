import type {SWRConfiguration} from "swr";

// SWR global configuration
export const swrConfig: SWRConfiguration = {
    // Revalidate on focus (when user returns to tab)
    revalidateOnFocus: true,

    // Revalidate on reconnect (when internet connection is restored)
    revalidateOnReconnect: true,

    // Dedupe requests within 2 seconds
    dedupingInterval: 2000,

    // Cache data for 5 minutes before considering it stale
    focusThrottleInterval: 5 * 60 * 1000,

    // Retry on error
    shouldRetryOnError: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000,

    // Keep previous data while fetching new data
    keepPreviousData: true,

    // Revalidate if data is older than 30 seconds
    revalidateIfStale: true,

    // Use cache first, then revalidate in background
    suspense: false,

    // Custom error handler
    onError: (error, key) => {
        console.error("[SWR Error]", key, error);
    },

    // Custom success handler
    onSuccess: (data, key) => {
        console.log("[v0] SWR cache hit:", key);
    },
};

// Cache key generators
export const cacheKeys = {
    profile: (userId: string) => `/profiles/${userId}`,
    profiles: (userIds: string[]) => `/profiles?ids=${userIds.join(",")}`,
    post: (postId: string) => `/posts/${postId}`,
    posts: (filters?: Record<string, any>) => `/posts${filters ? `?${new URLSearchParams(filters).toString()}` : ""}`,
    postLikes: (postId: string) => `/posts/${postId}/likes`,
    comments: (postId: string) => `/posts/${postId}/comments`,
    messages: (conversationId: string) => `/messages/${conversationId}`,
    conversations: () => "/conversations",
    notifications: (userId: string) => `/notifications/${userId}`,
    groups: () => "/groups",
    group: (groupId: string) => `/groups/${groupId}`,
    events: () => "/events",
    event: (eventId: string) => `/events/${eventId}`,
    followers: (userId: string) => `/users/${userId}/followers`,
    following: (userId: string) => `/users/${userId}/following`,
    media: (mediaId: string) => `/media/${mediaId}`,
    userMedia: (userId: string) => `/users/${userId}/media`,
};

// Cache time-to-live (TTL) configurations
export const cacheTTL = {
    profile: 5 * 60 * 1000, // 5 minutes
    posts: 2 * 60 * 1000, // 2 minutes
    messages: 30 * 1000, // 30 seconds
    notifications: 1 * 60 * 1000, // 1 minute
    static: 24 * 60 * 60 * 1000, // 24 hours
};

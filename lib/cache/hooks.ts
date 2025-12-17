"use client";

import useSWR, {mutate} from "swr";

import {createClient} from "@/lib/supabase/client";

import {cacheStorage} from "./storage";
import {cacheKeys, cacheTTL} from "./swr-config";

// Generic fetcher with IndexedDB caching
async function fetcherWithCache<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
    // Try to get from IndexedDB first
    const cached = await cacheStorage.get(key);
    if (cached) {
        return cached;
    }

    // Fetch from server
    const data = await fetcher();

    // Cache in IndexedDB
    await cacheStorage.set(key, data, ttl);

    return data;
}

// Hook for fetching user profile
export function useProfile(userId: string | null) {
    const key = userId ? cacheKeys.profile(userId) : null;

    return useSWR(
        key,
        async () => {
            if (!userId) {
                return null;
            }

            return fetcherWithCache(
                key!,
                async () => {
                    const supabase = createClient();
                    const {data, error} = await supabase.from("profiles").select("*").eq("id", userId).single();

                    if (error) {
                        throw error;
                    }
                    return data;
                },
                cacheTTL.profile,
            );
        },
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000, // 1 minute
        },
    );
}

// Hook for fetching multiple profiles
export function useProfiles(userIds: string[]) {
    const key = userIds.length > 0 ? cacheKeys.profiles(userIds) : null;

    return useSWR(key, async () => {
        if (userIds.length === 0) {
            return [];
        }

        return fetcherWithCache(
            key!,
            async () => {
                const supabase = createClient();
                const {data, error} = await supabase.from("profiles").select("*").in("id", userIds);

                if (error) {
                    throw error;
                }
                return data || [];
            },
            cacheTTL.profile,
        );
    });
}

// Hook for fetching post
export function usePost(postId: string | null) {
    const key = postId ? cacheKeys.post(postId) : null;

    return useSWR(key, async () => {
        if (!postId) {
            return null;
        }

        return fetcherWithCache(
            key!,
            async () => {
                const supabase = createClient();
                const {data, error} = await supabase.from("posts").select("*, profiles(*)").eq("id", postId).single();

                if (error) {
                    throw error;
                }
                return data;
            },
            cacheTTL.posts,
        );
    });
}

// Hook for fetching posts with filters
export function usePosts(filters?: Record<string, any>) {
    const key = cacheKeys.posts(filters);

    return useSWR(key, async () => {
        return fetcherWithCache(
            key,
            async () => {
                const supabase = createClient();
                let query = supabase.from("posts").select("*, profiles(*)");

                if (filters?.authorId) {
                    query = query.eq("author_id", filters.authorId);
                }

                if (filters?.groupId) {
                    query = query.eq("group_id", filters.groupId);
                }

                query = query.order("created_at", {ascending: false}).limit(20);

                const {data, error} = await query;

                if (error) {
                    throw error;
                }
                return data || [];
            },
            cacheTTL.posts,
        );
    });
}

// Hook for fetching post likes
export function usePostLikes(postId: string | null) {
    const key = postId ? cacheKeys.postLikes(postId) : null;

    return useSWR(
        key,
        async () => {
            if (!postId) {
                return {count: 0, userLiked: false};
            }

            const supabase = createClient();
            const {
                data: {user},
            } = await supabase.auth.getUser();

            const [likesResult, userLikeResult] = await Promise.all([
                supabase.from("post_likes").select("id", {count: "exact"}).eq("post_id", postId),
                user ? supabase.from("post_likes").select("id").eq("post_id", postId).eq("user_id", user.id).single() : null,
            ]);

            return {
                count: likesResult.count || 0,
                userLiked: !!userLikeResult?.data,
            };
        },
        {
            revalidateOnFocus: true,
            dedupingInterval: 5000,
        },
    );
}

// Hook for fetching notifications
export function useNotifications(userId: string | null) {
    const key = userId ? cacheKeys.notifications(userId) : null;

    return useSWR(
        key,
        async () => {
            if (!userId) {
                return [];
            }

            const supabase = createClient();
            const {data, error} = await supabase
                .from("notifications")
                .select("*, profiles(*)")
                .eq("user_id", userId)
                .order("created_at", {ascending: false})
                .limit(50);

            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            refreshInterval: 30000, // Refresh every 30 seconds
        },
    );
}

// Cache invalidation utilities
export const cacheUtils = {
    // Invalidate specific cache key
    invalidate: (key: string) => {
        mutate(key);
        cacheStorage.delete(key);
    },

    // Invalidate all posts
    invalidatePosts: () => {
        mutate((key) => typeof key === "string" && key.startsWith("/posts"));
    },

    // Invalidate profile
    invalidateProfile: (userId: string) => {
        mutate(cacheKeys.profile(userId));
        cacheStorage.delete(cacheKeys.profile(userId));
    },

    // Invalidate all cache
    invalidateAll: () => {
        mutate(() => true);
        cacheStorage.clear();
    },

    // Prefetch data
    prefetch: async (key: string, fetcher: () => Promise<any>) => {
        const data = await fetcher();
        mutate(key, data, false);
        return data;
    },
};

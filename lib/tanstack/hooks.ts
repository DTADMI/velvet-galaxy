"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";
import { queryKeys } from "./query-keys";

const supabase = createBrowserClient();

export function useProfile(userId: string | null) {
    return useQuery({
        queryKey: userId ? queryKeys.profiles.byId(userId) : ["profiles", "none"],
        queryFn: async () => {
            if (!userId) return null;
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useProfiles(userIds: string[]) {
    return useQuery({
        queryKey: userIds.length > 0 ? queryKeys.profiles.byIds(userIds) : ["profiles", "none"],
        queryFn: async () => {
            if (!userIds.length) return [];
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .in("id", userIds);
            if (error) throw error;
            return data || [];
        },
        enabled: userIds.length > 0,
        staleTime: 5 * 60 * 1000,
    });
}

export function usePost(postId: string | null) {
    return useQuery({
        queryKey: postId ? queryKeys.posts.byId(postId) : ["posts", "none"],
        queryFn: async () => {
            if (!postId) return null;
            const { data, error } = await supabase
                .from("posts")
                .select("*, profiles(*)")
                .eq("id", postId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!postId,
        staleTime: 2 * 60 * 1000,
    });
}

export function usePosts(filters?: Record<string, string>) {
    return useQuery({
        queryKey: queryKeys.posts.byFeed(filters),
        queryFn: async () => {
            let query = supabase
                .from("posts")
                .select("*, profiles(*)")
                .order("created_at", { ascending: false })
                .limit(20);

            if (filters?.authorId) query = query.eq("author_id", filters.authorId);
            if (filters?.groupId) query = query.eq("group_id", filters.groupId);

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        staleTime: 2 * 60 * 1000,
    });
}

export function useFeedPosts() {
    return useInfiniteQuery({
        queryKey: queryKeys.posts.byFeed(),
        queryFn: async ({ pageParam = 0 }) => {
            const { data, error } = await supabase
                .from("posts")
                .select("*, profiles(*)")
                .order("created_at", { ascending: false })
                .range(pageParam, pageParam + 19)
                .limit(20);
            if (error) throw error;
            return data || [];
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < 20) return undefined;
            return allPages.length * 20;
        },
        staleTime: 2 * 60 * 1000,
    });
}

export function useNotifications(userId: string | null) {
    return useQuery({
        queryKey: userId ? queryKeys.notifications.byUser(userId) : ["notifications", "none"],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await supabase
                .from("notifications")
                .select("*, profiles(*)")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(50);
            if (error) throw error;
            return data || [];
        },
        enabled: !!userId,
        refetchInterval: 30_000,
        staleTime: 1 * 60 * 1000,
    });
}

export function useUnreadNotificationCount(userId: string | null) {
    return useQuery({
        queryKey: userId ? queryKeys.notifications.unreadCount(userId) : ["notifications", "none"],
        queryFn: async () => {
            if (!userId) return 0;
            const { count, error } = await supabase
                .from("notifications")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("read", false);
            if (error) throw error;
            return count ?? 0;
        },
        enabled: !!userId,
        refetchInterval: 30_000,
    });
}

export function useMessages(conversationId: string | null) {
    return useQuery({
        queryKey: conversationId ? queryKeys.messages.byConversation(conversationId) : ["messages", "none"],
        queryFn: async () => {
            if (!conversationId) return [];
            const { data, error } = await supabase
                .from("messages")
                .select("*, sender:profiles!sender_id(*)")
                .eq("conversation_id", conversationId)
                .order("created_at", { ascending: true })
                .limit(100);
            if (error) throw error;
            return data || [];
        },
        enabled: !!conversationId,
        staleTime: 30 * 1000,
    });
}

export function useConversations() {
    return useQuery({
        queryKey: queryKeys.messages.conversations(),
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from("conversation_participants")
                .select("conversation_id, conversations(*)")
                .eq("user_id", user.id);

            if (error) throw error;
            return data?.map((d: any) => d.conversations) || [];
        },
        staleTime: 30 * 1000,
    });
}

export function useGroups(userId?: string) {
    return useQuery({
        queryKey: userId ? queryKeys.groups.byUser(userId) : queryKeys.groups.all,
        queryFn: async () => {
            let query = supabase.from("groups").select("*").order("created_at", { ascending: false });
            if (userId) {
                const { data: memberships } = await supabase
                    .from("group_members")
                    .select("group_id")
                    .eq("user_id", userId);
                const groupIds = memberships?.map((m: any) => m.group_id) || [];
                if (groupIds.length === 0) return [];
                query = query.in("id", groupIds);
            }
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useEvents() {
    return useQuery({
        queryKey: queryKeys.events.all,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("events")
                .select("*")
                .order("start_time", { ascending: true })
                .limit(50);
            if (error) throw error;
            return data || [];
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useIsFollowing(followerId: string | null, targetId: string | null) {
    return useQuery({
        queryKey: followerId && targetId
            ? queryKeys.follows.isFollowing(followerId, targetId)
            : ["follows", "none"],
        queryFn: async () => {
            if (!followerId || !targetId) return false;
            const { data, error } = await supabase
                .from("follows")
                .select("id")
                .eq("follower_id", followerId)
                .eq("following_id", targetId)
                .single();
            if (error && error.code !== "PGRST116") throw error;
            return !!data;
        },
        enabled: !!followerId && !!targetId,
        staleTime: 2 * 60 * 1000,
    });
}

export function useFollow(followerId: string, followingId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("follows")
                .insert({ follower_id: followerId, following_id: followingId });
            if (error) throw error;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.follows.isFollowing(followerId, followingId),
            });
            const previous = queryClient.getQueryData(
                queryKeys.follows.isFollowing(followerId, followingId)
            );
            queryClient.setQueryData(
                queryKeys.follows.isFollowing(followerId, followingId),
                true
            );
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous !== undefined) {
                queryClient.setQueryData(
                    queryKeys.follows.isFollowing(followerId, followingId),
                    context.previous
                );
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.follows.isFollowing(followerId, followingId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.follows.followers(followingId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.follows.following(followerId),
            });
        },
    });
}

export function useUnfollow(followerId: string, followingId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("follows")
                .delete()
                .eq("follower_id", followerId)
                .eq("following_id", followingId);
            if (error) throw error;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.follows.isFollowing(followerId, followingId),
            });
            const previous = queryClient.getQueryData(
                queryKeys.follows.isFollowing(followerId, followingId)
            );
            queryClient.setQueryData(
                queryKeys.follows.isFollowing(followerId, followingId),
                false
            );
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous !== undefined) {
                queryClient.setQueryData(
                    queryKeys.follows.isFollowing(followerId, followingId),
                    context.previous
                );
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.follows.isFollowing(followerId, followingId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.follows.followers(followingId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.follows.following(followerId),
            });
        },
    });
}

export function useLikePost(postId: string, userId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("post_likes")
                .insert({ post_id: postId, user_id: userId });
            if (error && error.code !== "23505") throw error;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: queryKeys.posts.likes(postId) });
            const previous = queryClient.getQueryData(queryKeys.posts.likes(postId));
            queryClient.setQueryData(queryKeys.posts.likes(postId), (old: any) => ({
                count: (old?.count ?? 0) + 1,
                userLiked: true,
            }));
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(queryKeys.posts.likes(postId), context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.posts.likes(postId) });
        },
    });
}

export function useUnlikePost(postId: string, userId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("post_likes")
                .delete()
                .eq("post_id", postId)
                .eq("user_id", userId);
            if (error) throw error;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: queryKeys.posts.likes(postId) });
            const previous = queryClient.getQueryData(queryKeys.posts.likes(postId));
            queryClient.setQueryData(queryKeys.posts.likes(postId), (old: any) => ({
                count: Math.max(0, (old?.count ?? 0) - 1),
                userLiked: false,
            }));
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(queryKeys.posts.likes(postId), context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.posts.likes(postId) });
        },
    });
}

export function useBookmarkPost(postId: string, userId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("bookmarks")
                .insert({ post_id: postId, user_id: userId });
            if (error && error.code !== "23505") throw error;
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all(userId) });
        },
    });
}

export function useRemoveBookmark(postId: string, userId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("bookmarks")
                .delete()
                .eq("post_id", postId)
                .eq("user_id", userId);
            if (error) throw error;
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all(userId) });
        },
    });
}

export function useCreatePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: FormData) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const content = formData.get("content") as string;
            const contentRating = (formData.get("content_rating") as string) || "SFW";

            const { data, error } = await supabase
                .from("posts")
                .insert({
                    author_id: user.id,
                    content,
                    content_rating: contentRating,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.posts.byFeed() });
        },
    });
}

export function useSendMessage(conversationId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (content: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from("messages")
                .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    content,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.messages.byConversation(conversationId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.messages.conversations(),
            });
        },
    });
}

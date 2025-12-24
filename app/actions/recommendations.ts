"use server";

import {createServerClient} from "@/lib/supabase/server";

export async function getRecommendedContent() {
    const supabase = await createServerClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        // Return popular content for unauthenticated users
        const {data: popularPosts} = await supabase
            .from("posts")
            .select(`
                *,
                author_profile:author_id (id, username, display_name, avatar_url)
            `)
            .order("created_at", {ascending: false})
            .limit(5);

        const {data: popularToys} = await supabase
            .from("toys")
            .select("*")
            .order("rating", {ascending: false})
            .limit(3);

        return {
            posts: popularPosts || [],
            toys: popularToys || [],
            type: "trending"
        };
    }

    // Basic AI-like recommendation logic: 
    // 1. Get user's interests from bio/tags
    // 2. Get content from similar users
    // 3. Prioritize content with high engagement

    // For now, let's fetch based on user's liked content tags
    const {data: likedPosts} = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id);

    const likedIds = likedPosts?.map(lp => lp.post_id) || [];

    // Simple recommendation: posts from authors user follows or popular posts if no follows
    const {data: following} = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

    const followingIds = following?.map(f => f.following_id) || [];

    const {data: recommendedPosts} = await supabase
        .from("posts")
        .select(`
            *,
            author_profile:author_id (id, username, display_name, avatar_url)
        `)
        .in("author_id", followingIds)
        .order("created_at", {ascending: false})
        .limit(10);

    const {data: recommendedToys} = await supabase
        .from("toys")
        .select("*")
        .limit(5);

    return {
        posts: recommendedPosts || [],
        toys: recommendedToys || [],
        type: "personalized"
    };
}

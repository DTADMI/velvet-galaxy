"use server";

import {createServerClient} from "@/lib/supabase/server";

export async function getPopularContent(latitude?: number, longitude?: number) {
    const supabase = await createServerClient();

    let query = supabase
        .from("posts")
        .select(`
            *,
            author_profile:profiles!inner (id, username, display_name, avatar_url, latitude, longitude)
        `);

    if (latitude && longitude) {
        query = query
            .gte("author_profile.latitude", latitude - 2)
            .lte("author_profile.latitude", latitude + 2)
            .gte("author_profile.longitude", longitude - 2)
            .lte("author_profile.longitude", longitude + 2);
    }

    const {data: popularPosts} = await query
        .order("created_at", {ascending: false})
        .limit(20);

    return popularPosts || [];
}

export async function getLikedContent() {
    const supabase = await createServerClient();
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) return [];

    const {data} = await supabase
        .from("post_likes")
        .select(`
            posts (
                *,
                author_profile:profiles!inner (id, username, display_name, avatar_url)
            )
        `)
        .eq("user_id", user.id)
        .order("created_at", {ascending: false});

    return data?.map(d => d.posts) || [];
}

export async function getCuratedContent() {
    const supabase = await createServerClient();
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch user interests
    const {data: interests} = await supabase
        .from("user_interests")
        .select("tag_id")
        .eq("user_id", user.id);

    const tagIds = interests?.map(i => i.tag_id) || [];

    // Find posts with matching tags (assuming a post_tags table exists or content search)
    // For now, simpler matching or fall back to high engagement posts
    const {data: curatedPosts} = await supabase
        .from("posts")
        .select(`
            *,
            author_profile:profiles!inner (id, username, display_name, avatar_url)
        `)
        .order("created_at", {ascending: false})
        .limit(20);

    return curatedPosts || [];
}

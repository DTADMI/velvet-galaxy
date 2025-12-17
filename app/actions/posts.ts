"use server";

import {revalidatePath} from "next/cache";

import {checkRateLimit} from "@/lib/rate-limit";
import {createServerClient} from "@/lib/supabase/server";

export async function createPost(formData: FormData) {
    const supabase = await createServerClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        return {error: "Not authenticated"};
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, "post_create");
    if (!rateLimit.allowed) {
        return {
            error: `Rate limit exceeded. Try again in ${Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)} seconds.`,
            rateLimitExceeded: true,
        };
    }

    const content = formData.get("content") as string;
    const contentRating = formData.get("content_rating") as string; // Declare the variable here
    const mediaUrl = formData.get("media_url") as string | null;
    const mediaType = formData.get("media_type") as string | null;

    const {data, error} = await supabase
        .from("posts")
        .insert({
            author_id: user.id,
            content,
            content_rating: contentRating,
            media_url: mediaUrl,
            media_type: mediaType,
        })
        .select()
        .single();

    if (error) {
        return {error: error.message};
    }

    revalidatePath("/feed");
    return {success: true, post: data};
}

export async function likePost(postId: string) {
    const supabase = await createServerClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        return {error: "Not authenticated"};
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, "like");
    if (!rateLimit.allowed) {
        return {
            error: "Rate limit exceeded. Please slow down.",
            rateLimitExceeded: true,
        };
    }

    const {error} = await supabase.from("post_likes").insert({post_id: postId, user_id: user.id});

    if (error) {
        return {error: error.message};
    }

    revalidatePath("/feed");
    return {success: true};
}

"use server";

import {revalidatePath} from "next/cache";

import {checkRateLimit} from "@/lib/rate-limit";
import {createServerClient} from "@/lib/supabase/server";

export async function createComment(postId: string, content: string, parentCommentId?: string) {
    const supabase = await createServerClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        return {error: "Not authenticated"};
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, "comment_create");
    if (!rateLimit.allowed) {
        return {
            error: `Rate limit exceeded. Try again in ${Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)} seconds.`,
            rateLimitExceeded: true,
        };
    }

    const {data, error} = await supabase
        .from("comments")
        .insert({
            post_id: postId,
            user_id: user.id,
            content,
            parent_comment_id: parentCommentId || null,
        })
        .select()
        .single();

    if (error) {
        return {error: error.message};
    }

    revalidatePath(`/post/${postId}`);
    return {success: true, comment: data};
}

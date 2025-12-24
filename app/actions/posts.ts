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
    const contentRating = formData.get("content_rating") as string;
    const mediaUrl = formData.get("media_url") as string | null;
    const mediaType = formData.get("media_type") as string | null;
    const coAuthors = formData.get("co_authors") as string | null; // JSON string of user IDs

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

    // Handle co-authors
    if (coAuthors) {
        const authorIds = JSON.parse(coAuthors) as string[];
        if (authorIds.length > 0) {
            const coAuthorInserts = authorIds.map(id => ({
                post_id: data.id,
                user_id: id,
                status: 'pending'
            }));

            const {error: coAuthorError} = await supabase
                .from("post_authors")
                .insert(coAuthorInserts);

            if (coAuthorError) {
                console.error("Co-author invitation error:", coAuthorError);
            }

            // Create notifications for co-authors
            for (const coAuthorId of authorIds) {
                await supabase.from("notifications").insert({
                    user_id: coAuthorId,
                    from_user_id: user.id,
                    type: "co_author_invitation",
                    title: "Co-authorship Invitation",
                    message: `${user.user_metadata.display_name || user.email} invited you to be a co-author on their post.`,
                    link: `/posts/${data.id}`,
                    read: false
                });
            }
        }
    }

    revalidatePath("/feed");
    return {success: true, post: data};
}

export async function updatePost(postId: string, content: string) {
    const supabase = await createServerClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        return {error: "Not authenticated"};
    }

    // Check if post exists and user is owner
    const {data: post, error: fetchError} = await supabase
        .from("posts")
        .select("created_at, author_id")
        .eq("id", postId)
        .single();

    if (fetchError || !post) {
        return {error: "Post not found"};
    }

    if (post.author_id !== user.id) {
        return {error: "Unauthorized"};
    }

    // Check edit time limit (e.g., 24 hours)
    const createdAt = new Date(post.created_at);
    const now = new Date();
    const limit = 24 * 60 * 60 * 1000; // 24 hours in ms

    if (now.getTime() - createdAt.getTime() > limit) {
        return {error: "Edit time limit exceeded (24 hours)"};
    }

    const {error: updateError} = await supabase
        .from("posts")
        .update({content, updated_at: now.toISOString()})
        .eq("id", postId);

    if (updateError) {
        return {error: updateError.message};
    }

    revalidatePath("/feed");
    revalidatePath(`/posts/${postId}`);
    return {success: true};
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

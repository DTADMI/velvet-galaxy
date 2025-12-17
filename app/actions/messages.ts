"use server";

import {checkRateLimit} from "@/lib/rate-limit";
import {createServerClient} from "@/lib/supabase/server";

export async function sendMessage(conversationId: string, content: string) {
    const supabase = await createServerClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        return {error: "Not authenticated"};
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, "message_send");
    if (!rateLimit.allowed) {
        return {
            error: "You are sending messages too quickly. Please slow down.",
            rateLimitExceeded: true,
        };
    }

    const {data, error} = await supabase
        .from("messages")
        .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content,
        })
        .select()
        .single();

    if (error) {
        return {error: error.message};
    }

    return {success: true, message: data};
}

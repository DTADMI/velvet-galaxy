import {createServerClient} from "@/lib/supabase/server";

interface RateLimitConfig {
    maxRequests: number
    windowMs: number
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
    post_create: {maxRequests: 10, windowMs: 60000}, // 10 posts per minute
    comment_create: {maxRequests: 20, windowMs: 60000}, // 20 comments per minute
    message_send: {maxRequests: 30, windowMs: 60000}, // 30 messages per minute
    like: {maxRequests: 50, windowMs: 60000}, // 50 likes per minute
    follow: {maxRequests: 20, windowMs: 60000}, // 20 follows per minute
    auth_login: {maxRequests: 5, windowMs: 300000}, // 5 login attempts per 5 minutes
    auth_signup: {maxRequests: 3, windowMs: 3600000}, // 3 signups per hour
};

export async function checkRateLimit(
    userId: string,
    action: keyof typeof RATE_LIMITS,
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const supabase = await createServerClient();
    const config = RATE_LIMITS[action];

    if (!config) {
        return {allowed: true, remaining: 999, resetAt: new Date(Date.now() + 60000)};
    }

    const windowStart = new Date(Date.now() - config.windowMs);

    // Count recent actions
    const {count} = await supabase
        .from("rate_limits")
        .select("*", {count: "exact", head: true})
        .eq("user_id", userId)
        .eq("action", action)
        .gte("created_at", windowStart.toISOString());

    const requestCount = count || 0;
    const remaining = Math.max(0, config.maxRequests - requestCount);
    const allowed = requestCount < config.maxRequests;

    if (allowed) {
        // Record this action
        await supabase.from("rate_limits").insert({
            user_id: userId,
            action,
            ip_address: null, // Could be added from headers
        });
    }

    const resetAt = new Date(Date.now() + config.windowMs);

    return {allowed, remaining, resetAt};
}

export async function cleanupOldRateLimits() {
    const supabase = await createServerClient();
    const oneDayAgo = new Date(Date.now() - 86400000);

    await supabase.from("rate_limits").delete().lt("created_at", oneDayAgo.toISOString());
}

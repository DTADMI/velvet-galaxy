import {createServerClient} from "@/lib/supabase/server";
import {checkRateLimit as redisCheckRateLimit} from "@/lib/redis/rate-limit";

let _pgRateLimit: boolean | null = null;
async function shouldUsePgRateLimit(): Promise<boolean> {
  if (_pgRateLimit !== null) return _pgRateLimit;
  if (process.env.PG_RATE_LIMIT === "true") { _pgRateLimit = true; return true; }
  try {
    const supabase = await createServerClient();
    const { data } = await (supabase as any).from("feature_flags").select("enabled").eq("name", "pg_rate_limit").maybeSingle();
    _pgRateLimit = data?.enabled === true;
  } catch { _pgRateLimit = false; }
  return _pgRateLimit;
}

interface RateLimitConfig {
    maxRequests: number
    windowMs: number
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
    post_create: {maxRequests: 10, windowMs: 60000},
    comment_create: {maxRequests: 20, windowMs: 60000},
    message_send: {maxRequests: 30, windowMs: 60000},
    like: {maxRequests: 50, windowMs: 60000},
    follow: {maxRequests: 20, windowMs: 60000},
    auth_login: {maxRequests: 5, windowMs: 300000},
    auth_signup: {maxRequests: 3, windowMs: 3600000},
};

export async function checkRateLimit(
    userId: string,
    action: keyof typeof RATE_LIMITS,
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const redisResult = await redisCheckRateLimit(userId, action);
    if (redisResult.resetAt < Date.now() + 5000) {
        return {
            allowed: redisResult.allowed,
            remaining: redisResult.remaining,
            resetAt: new Date(redisResult.resetAt),
        };
    }

    if (!redisResult.allowed) {
        return {
            allowed: false,
            remaining: redisResult.remaining,
            resetAt: new Date(redisResult.resetAt),
        };
    }

    if (!(await shouldUsePgRateLimit())) {
      return {
        allowed: redisResult.allowed,
        remaining: redisResult.remaining,
        resetAt: new Date(redisResult.resetAt),
      };
    }

    const supabase = await createServerClient();
    const config = RATE_LIMITS[action];

    if (!config) {
        return {allowed: true, remaining: 999, resetAt: new Date(Date.now() + 60000)};
    }

    const windowStart = new Date(Date.now() - config.windowMs);

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
        await supabase.from("rate_limits").insert({
            user_id: userId,
            action,
            ip_address: null,
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

import {createServerClient} from "@/lib/supabase/server";
import {checkRateLimit as redisCheckRateLimit} from "@/lib/redis/rate-limit";
import {checkPgRateLimit} from "@/lib/security/pg-rate-limit";

let _redisRateLimit: boolean | null = null;
async function shouldUseRedisRateLimit(): Promise<boolean> {
  if (_redisRateLimit !== null) return _redisRateLimit;
  if (process.env.REDIS_RATE_LIMIT === "true") { _redisRateLimit = true; return true; }
  try {
    const supabase = await createServerClient();
    const { data } = await (supabase as any).from("feature_flags").select("enabled").eq("name", "redis_rate_limit").maybeSingle();
    _redisRateLimit = data?.enabled === true;
  } catch { _redisRateLimit = false; }
  return _redisRateLimit;
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
    const config = RATE_LIMITS[action];
    if (!config) {
        return {allowed: true, remaining: 999, resetAt: new Date(Date.now() + 60000)};
    }

    // PG is the default
    if (!(await shouldUseRedisRateLimit())) {
        const windowSeconds = Math.ceil(config.windowMs / 1000);
        const pgResult = await checkPgRateLimit(userId, { maxRequests: config.maxRequests, windowSeconds }, action);
        return {
            allowed: pgResult.allowed,
            remaining: pgResult.remaining,
            resetAt: new Date(pgResult.resetAt * 1000),
        };
    }

    // Redis path
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

    return {
        allowed: redisResult.allowed,
        remaining: redisResult.remaining,
        resetAt: new Date(redisResult.resetAt),
    };
}

export async function cleanupOldRateLimits() {
    const supabase = await createServerClient();
    const oneDayAgo = new Date(Date.now() - 86400000);

    await supabase.from("rate_limits").delete().lt("created_at", oneDayAgo.toISOString());
}

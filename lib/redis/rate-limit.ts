import "server-only";

import { getRedis, withRedis } from "./client";

const RATE_LIMIT_PREFIX = "vg:rl";

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
    post_create: { maxRequests: 10, windowMs: 60000 },
    comment_create: { maxRequests: 20, windowMs: 60000 },
    message_send: { maxRequests: 30, windowMs: 60000 },
    like: { maxRequests: 50, windowMs: 60000 },
    follow: { maxRequests: 20, windowMs: 60000 },
    auth_login: { maxRequests: 5, windowMs: 300000 },
    auth_signup: { maxRequests: 3, windowMs: 3600000 },
    media_upload: { maxRequests: 10, windowMs: 60000 },
    search: { maxRequests: 30, windowMs: 60000 },
    ai_request: { maxRequests: 20, windowMs: 60000 },
};

export async function checkRateLimit(
    identifier: string,
    action: keyof typeof RATE_LIMITS
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const config = RATE_LIMITS[action];
    if (!config) {
        return { allowed: true, remaining: 999, resetAt: Date.now() + 60000 };
    }

    const redisKey = `${RATE_LIMIT_PREFIX}:${action}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    return withRedis(
        async (redis) => {
            const pipeline = redis.pipeline();

            pipeline.zremrangebyscore(redisKey, 0, windowStart);
            pipeline.zcard(redisKey);
            pipeline.zadd(redisKey, { score: now, member: `${now}-${Math.random().toString(36).slice(2, 8)}` });
            pipeline.zrange(redisKey, 0, -1);
            pipeline.expire(redisKey, Math.ceil(config.windowMs / 1000) * 2);

            const results = await pipeline.exec();
            if (!results) {
                return { allowed: true, remaining: 999, resetAt: now + config.windowMs };
            }

            const count = (results[1] as number) || 0;
            const remaining = Math.max(0, config.maxRequests - count);
            const allowed = count < config.maxRequests;

            const members = (results[3] as string[]) || [];
            const oldestTimestamp = members.length > 0
                ? parseInt(members[0].split("-")[0], 10)
                : now;
            const resetAt = oldestTimestamp + config.windowMs;

            if (!allowed) {
                await redis.zremrangebyrank(redisKey, 0, 0);
            }

            return { allowed, remaining, resetAt };
        },
        { allowed: true, remaining: 999, resetAt: Date.now() + 60000 }
    );
}

export async function getRateLimitStatus(
    identifier: string,
    action: keyof typeof RATE_LIMITS
): Promise<{ remaining: number; resetAt: number }> {
    const config = RATE_LIMITS[action];
    if (!config) {
        return { remaining: 999, resetAt: Date.now() + 60000 };
    }

    const redisKey = `${RATE_LIMIT_PREFIX}:${action}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    return withRedis(
        async (redis) => {
            await redis.zremrangebyscore(redisKey, 0, windowStart);
            const count = (await redis.zcard(redisKey)) || 0;
            const remaining = Math.max(0, config.maxRequests - count);

            const rawMembers = await redis.zrange(redisKey, 0, 0);
            const members = (Array.isArray(rawMembers) ? rawMembers : []) as unknown as string[];
            const oldestTimestamp = members.length > 0
                ? parseInt(String(members[0]).split("-")[0], 10)
                : now;
            const resetAt = oldestTimestamp + config.windowMs;

            return { remaining, resetAt };
        },
        { remaining: 999, resetAt: Date.now() + 60000 }
    );
}

import "server-only";

import { getRedis, withRedis } from "./client";

const CACHE_PREFIX = "vg:cache";

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

export async function getCached<T>(key: string): Promise<T | null> {
    const redisKey = `${CACHE_PREFIX}:${key}`;

    return withRedis(
        async (redis) => {
            const raw = await redis.get<string>(redisKey);
            if (!raw) return null;

            const entry: CacheEntry<T> = JSON.parse(raw);
            if (Date.now() - entry.timestamp > entry.ttl) {
                await redis.del(redisKey);
                return null;
            }

            return entry.data;
        },
        null
    );
}

export async function setCached<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): Promise<boolean> {
    const redisKey = `${CACHE_PREFIX}:${key}`;

    return withRedis(
        async (redis) => {
            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                ttl: ttlMs,
            };
            const ttlSeconds = Math.ceil(ttlMs / 1000);
            await redis.set(redisKey, JSON.stringify(entry), { ex: ttlSeconds * 2 });
            return true;
        },
        false
    );
}

export async function invalidateCache(key: string): Promise<boolean> {
    const redisKey = `${CACHE_PREFIX}:${key}`;

    return withRedis(
        async (redis) => {
            await redis.del(redisKey);
            return true;
        },
        false
    );
}

export async function invalidateCachePattern(pattern: string): Promise<boolean> {
    return withRedis(
        async (redis) => {
            const fullPattern = `${CACHE_PREFIX}:${pattern}`;
            let cursor = 0;
            do {
                const [nextCursor, keys] = await redis.scan(cursor, {
                    match: fullPattern,
                    count: 100,
                });
                cursor = Number(nextCursor);
                if (Array.isArray(keys) && keys.length > 0) {
                    await redis.del(...keys);
                }
            } while (cursor !== 0);
            return true;
        },
        false
    );
}

export async function getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000
): Promise<T> {
    const cached = await getCached<T>(key);
    if (cached !== null) return cached;

    const data = await fetcher();
    await setCached(key, data, ttlMs);
    return data;
}

export const CacheTTL = {
    PROFILE: 5 * 60 * 1000,
    POST: 2 * 60 * 1000,
    POST_LIST: 1 * 60 * 1000,
    MESSAGE: 30 * 1000,
    NOTIFICATION: 1 * 60 * 1000,
    FEATURE_FLAG: 15 * 60 * 1000,
    AI_RESPONSE: 60 * 60 * 1000,
    STATIC: 24 * 60 * 60 * 1000,
    SEARCH: 30 * 1000,
};

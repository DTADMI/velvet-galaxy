import "server-only";

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedis(): Redis | null {
    if (redis) return redis;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        console.warn("[VG:Redis] Missing Upstash Redis credentials. Redis features disabled.");
        return null;
    }

    redis = new Redis({ url, token });
    return redis;
}

export async function withRedis<T>(
    fn: (r: Redis) => Promise<T>,
    fallback: T
): Promise<T> {
    const r = getRedis();
    if (!r) return fallback;
    try {
        return await fn(r);
    } catch (err) {
        console.error("[VG:Redis] Operation failed:", err);
        return fallback;
    }
}

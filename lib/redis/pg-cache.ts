import "server-only";
import { createClient } from "@/lib/supabase/server";
import { Redis } from "@upstash/redis";

const CACHE_DEFAULT_TTL = 300;

let _redis: Redis | null = null;
function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

let _redisCacheEnabled: boolean | null = null;

async function shouldUseRedisCache(): Promise<boolean> {
  if (_redisCacheEnabled !== null) return _redisCacheEnabled;
  if (process.env.REDIS_CACHE === "true") { _redisCacheEnabled = true; return true; }
  try {
    const supabase = await createClient();
    const { data } = await (supabase as any).from("feature_flags")
      .select("enabled").eq("name", "redis_cache").maybeSingle();
    _redisCacheEnabled = data?.enabled === true;
  } catch { _redisCacheEnabled = false; }
  return _redisCacheEnabled;
}

export async function pgGetCached<T>(key: string): Promise<T | null> {
  try {
    // L1: Redis (if enabled)
    if (await shouldUseRedisCache()) {
      const r = getRedis();
      if (r) {
        const cached = await r.get<T>(`cache:${key}`);
        if (cached !== null) return cached;
      }
    }

    // L2: PostgreSQL (source of truth)
    const supabase = await createClient();
    const { data } = await supabase.from("app_cache")
      .select("value").eq("key", key)
      .gt("expires_at", new Date().toISOString()).maybeSingle();
    if (!data) return null;
    const result = data.value as T;

    // Warm L1
    if (await shouldUseRedisCache()) {
      const r = getRedis();
      if (r) r.set(`cache:${key}`, result, { ex: 30 }).catch(() => {});
    }

    return result;
  } catch { return null; }
}

export async function pgSetCached<T>(key: string, value: T, ttlSeconds = CACHE_DEFAULT_TTL): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("app_cache").upsert({
      key, value: JSON.parse(JSON.stringify(value)),
      expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    }, { onConflict: "key" });

    if (await shouldUseRedisCache()) {
      const r = getRedis();
      if (r) r.set(`cache:${key}`, value, { ex: Math.min(ttlSeconds, 60) }).catch(() => {});
    }
  } catch (err) { console.error("[pg-cache] set error:", err); }
}

export async function pgDeleteCached(key: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("app_cache").delete().eq("key", key);

    if (await shouldUseRedisCache()) {
      const r = getRedis();
      if (r) r.del(`cache:${key}`).catch(() => {});
    }
  } catch (err) { console.error("[pg-cache] delete error:", err); }
}

export async function pgInvalidatePattern(pattern: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("app_cache").delete().like("key", `${pattern}%`);
  } catch (err) { console.error("[pg-cache] invalidate error:", err); }
}

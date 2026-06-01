import "server-only";

interface PgRateLimitResult { allowed: boolean; remaining: number; resetAt: number; }
interface RateLimitConfig { maxRequests: number; windowSeconds: number; }

export async function checkPgRateLimit(identifier: string, config: RateLimitConfig, route = "default"): Promise<PgRateLimitResult> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("check_rate_limit", { p_identifier: identifier, p_route: route, p_max_requests: config.maxRequests, p_window_seconds: config.windowSeconds });
    if (error || !data) return { allowed: true, remaining: config.maxRequests - 1, resetAt: Math.floor(Date.now() / 1000) + config.windowSeconds };
    return data as PgRateLimitResult;
  } catch { return { allowed: true, remaining: config.maxRequests - 1, resetAt: Math.floor(Date.now() / 1000) + config.windowSeconds }; }
}

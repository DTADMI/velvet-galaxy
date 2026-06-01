// Account Lockout — PG source of truth + Redis L1 when redis_lockout flag enabled
import { Redis } from "@upstash/redis";

const MAX_ATTEMPTS = 5;
const LOCKOUT_TTL_SECONDS = 900;
const MAX_ATTEMPTS_GLOBAL = 3;
const GLOBAL_TTL_SECONDS = 60;

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

function normalizeEmail(email: string): string { return email.trim().toLowerCase(); }

let _redisLockout: boolean | null = null;
let _lockoutPgModule: any = null;

async function shouldUseRedisLockout(): Promise<boolean> {
  if (_redisLockout !== null) return _redisLockout;
  if (process.env.REDIS_LOCKOUT === "true") { _redisLockout = true; return true; }
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await (supabase as any).from("feature_flags")
      .select("enabled").eq("name", "redis_lockout").maybeSingle();
    _redisLockout = data?.enabled === true;
  } catch { _redisLockout = false; }
  return _redisLockout;
}

async function getPgLockoutModule() {
  if (!_lockoutPgModule) _lockoutPgModule = await import("@/lib/auth/account-lockout-pg");
  return _lockoutPgModule;
}

// --- Global IP-based rate limiting (across all accounts) ---
let _globalRedis: Redis | null = null;
function getGlobalRedis(): Redis | null { return _globalRedis || (_globalRedis = getRedis()); }

async function checkGlobalLockout(ip: string): Promise<boolean> {
  const r = getGlobalRedis();
  if (!r) return false;
  const key = `lockout:global:${ip}`;
  const count = ((await r.get<number>(key)) || 0) + 1;
  if (count > MAX_ATTEMPTS_GLOBAL) {
    await r.set(key, count, { ex: GLOBAL_TTL_SECONDS });
    return true;
  }
  await r.set(key, count, { ex: GLOBAL_TTL_SECONDS });
  return false;
}

// --- Public API ---
export async function checkLockout(email: string, ip?: string): Promise<{
  locked: boolean;
  remainingAttempts: number;
  globalLocked?: boolean;
}> {
  if (ip) {
    const globalLocked = await checkGlobalLockout(ip);
    if (globalLocked) return { locked: true, remainingAttempts: 0, globalLocked: true };
  }

  // L1: Redis (if enabled)
  if (await shouldUseRedisLockout()) {
    const r = getRedis();
    if (r) {
      const key = `lockout:${normalizeEmail(email)}`;
      const attempts = await r.get<number>(key);
      if (attempts !== null) {
        const locked = attempts >= MAX_ATTEMPTS;
        return { locked, remainingAttempts: locked ? 0 : MAX_ATTEMPTS - (attempts || 0) };
      }
    }
  }

  // L2: PostgreSQL (source of truth)
  const mod = await getPgLockoutModule();
  return mod.checkPgLockout(email);
}

export async function recordFailedAttempt(email: string, ip?: string): Promise<void> {
  if (ip) await checkGlobalLockout(ip);

  // Always write to PG (source of truth)
  const mod = await getPgLockoutModule();
  await mod.recordPgFailedAttempt(email);

  // Warm L1
  if (await shouldUseRedisLockout()) {
    const r = getRedis();
    if (r) {
      const key = `lockout:${normalizeEmail(email)}`;
      const count = ((await r.get<number>(key)) || 0) + 1;
      await r.set(key, count, { ex: LOCKOUT_TTL_SECONDS });
    }
  }
}

export async function resetLockout(email: string): Promise<void> {
  const mod = await getPgLockoutModule();
  await mod.resetPgLockout(email);

  if (await shouldUseRedisLockout()) {
    const r = getRedis();
    if (r) await r.del(`lockout:${normalizeEmail(email)}`);
  }
}

export async function getLockoutTTL(email: string): Promise<number | null> {
  const r = getRedis();
  if (!r) return null;
  const key = `lockout:${normalizeEmail(email)}`;
  const ttl = await r.ttl(key);
  return ttl && ttl > 0 ? ttl : null;
}

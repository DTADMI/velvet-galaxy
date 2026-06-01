// Account Lockout — Dual Redis + PG via feature flag
// Set PG_LOCKOUT=true or enable pg_lockout DB flag to use PG path
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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// PG path (lazy init to avoid circular deps)
let _pgLockout: boolean | null = null;
let _lockoutPgModule: any = null;

async function usePgLockout(): Promise<boolean> {
  if (_pgLockout !== null) return _pgLockout;
  if (process.env.PG_LOCKOUT === "true") { _pgLockout = true; return true; }
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await (supabase as any).from("feature_flags")
      .select("enabled").eq("name", "pg_lockout").maybeSingle();
    _pgLockout = data?.enabled === true;
  } catch { _pgLockout = false; }
  return _pgLockout;
}

async function getPgLockoutModule() {
  if (!_lockoutPgModule) {
    _lockoutPgModule = await import("@/lib/auth/account-lockout-pg");
  }
  return _lockoutPgModule;
}

// --- Redis-based lockout ---
async function getFailedAttemptsRedis(email: string): Promise<number> {
  const r = getRedis();
  if (!r) return 0;
  const key = `lockout:${normalizeEmail(email)}`;
  const val = await r.get<number>(key);
  return val || 0;
}

async function setFailedAttemptsRedis(email: string, count: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  const key = `lockout:${normalizeEmail(email)}`;
  if (count <= 0) {
    await r.del(key);
  } else {
    await r.set(key, count, { ex: LOCKOUT_TTL_SECONDS });
  }
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

  if (await usePgLockout()) {
    const mod = await getPgLockoutModule();
    const result = await mod.checkPgLockout(email);
    return { locked: result.locked, remainingAttempts: result.remainingAttempts };
  }

  const attempts = await getFailedAttemptsRedis(email);
  const locked = attempts >= MAX_ATTEMPTS;
  const remainingAttempts = locked ? 0 : MAX_ATTEMPTS - attempts;
  return { locked, remainingAttempts };
}

export async function recordFailedAttempt(email: string, ip?: string): Promise<void> {
  if (ip) await checkGlobalLockout(ip);

  if (await usePgLockout()) {
    const mod = await getPgLockoutModule();
    await mod.recordPgFailedAttempt(email);
    return;
  }
  const attempts = await getFailedAttemptsRedis(email);
  await setFailedAttemptsRedis(email, attempts + 1);
}

export async function resetLockout(email: string): Promise<void> {
  if (await usePgLockout()) {
    const mod = await getPgLockoutModule();
    await mod.resetPgLockout(email);
    return;
  }
  await setFailedAttemptsRedis(email, 0);
}

export async function getLockoutTTL(email: string): Promise<number | null> {
  if (await usePgLockout()) {
    return null; // PG path doesn't expose TTL
  }
  const r = getRedis();
  if (!r) return null;
  const key = `lockout:${normalizeEmail(email)}`;
  const ttl = await r.ttl(key);
  return ttl && ttl > 0 ? ttl : null;
}

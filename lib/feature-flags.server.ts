import "server-only";

import { createServerClient } from "@/lib/supabase/server";
import { getCached, setCached, invalidateCache } from "@/lib/redis/cache";
import { FEATURE_FLAGS, getDefaultFlags } from "@/lib/feature-flags";

const REDIS_KEY = "feature_flags";
const TTL_MS = 60_000;

export async function getFeatureFlags(): Promise<Record<string, boolean>> {
    const cached = await getCached<Record<string, boolean>>(REDIS_KEY);
    if (cached) return cached;

    try {
        const supabase = await createServerClient();
        const { data, error } = await supabase
            .from("feature_flags")
            .select("name, is_enabled");

        if (!error && data) {
            const flags = getDefaultFlags();
            for (const row of data) {
                flags[row.name] = row.is_enabled;
            }
            await setCached(REDIS_KEY, flags, TTL_MS);
            return flags;
        }
    } catch (err) {
        console.warn("[VG:FeatureFlags] Supabase query failed, using defaults:", err);
    }

    return getDefaultFlags();
}

export async function isFeatureEnabled(flagId: string): Promise<boolean> {
    const cached = await getCached<Record<string, boolean>>(REDIS_KEY);
    if (cached) return cached[flagId] ?? FEATURE_FLAGS[flagId]?.enabled ?? false;

    const flags = await getFeatureFlags();
    return flags[flagId] ?? FEATURE_FLAGS[flagId]?.enabled ?? false;
}

export async function invalidateFlagCache(): Promise<boolean> {
    return invalidateCache(REDIS_KEY);
}

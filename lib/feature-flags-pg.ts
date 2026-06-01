import "server-only";

const flagCache = new Map<string, boolean>(); let lastRefresh = 0; const CACHE_MS = 2_000;

export async function isPgFlagEnabled(flagName: string): Promise<boolean> {
  try {
    if (Date.now() - lastRefresh < CACHE_MS && flagCache.has(flagName)) return flagCache.get(flagName)!;
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.from("feature_flags").select("enabled").eq("name", flagName).maybeSingle();
    const enabled = data?.enabled ?? false;
    flagCache.set(flagName, enabled); lastRefresh = Date.now();
    return enabled;
  } catch { return false; }
}

export async function setPgFeatureFlag(name: string, enabled: boolean, value?: unknown): Promise<void> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.from("feature_flags").upsert({ name, enabled, value: value ?? enabled, updated_at: new Date().toISOString() }, { onConflict: "name" });
  flagCache.delete(name); lastRefresh = 0;
}

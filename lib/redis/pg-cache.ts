import "server-only";

export async function pgGetCached<T>(key: string): Promise<T | null> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.from("app_cache").select("value").eq("key", key).gt("expires_at", new Date().toISOString()).maybeSingle();
    return data?.value as T ?? null;
  } catch { return null; }
}

export async function pgSetCached<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.from("app_cache").upsert({ key, value: JSON.parse(JSON.stringify(value)), expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString() }, { onConflict: "key" });
  } catch (err) { console.error("[pg-cache] set error:", err); }
}

export async function pgDeleteCached(key: string): Promise<void> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.from("app_cache").delete().eq("key", key);
  } catch (err) { console.error("[pg-cache] delete error:", err); }
}

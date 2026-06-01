// PG LISTEN/NOTIFY listener — flushes caches on feature flag changes
// Uses Supabase Realtime (Postgres Changes)
let unsubscribeFn: (() => void) | null = null;

type CacheFlushCallback = () => void;
const flushCallbacks: CacheFlushCallback[] = [];

export function registerFlushCallback(cb: CacheFlushCallback): () => void {
  flushCallbacks.push(cb);
  return () => { const idx = flushCallbacks.indexOf(cb); if (idx >= 0) flushCallbacks.splice(idx, 1); };
}

async function flushAllCaches(): Promise<void> {
  for (const cb of flushCallbacks) { try { cb(); } catch {} }
}

export async function startFlagListener(): Promise<void> {
  if (unsubscribeFn) return;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const channel = supabase
      .channel("feature-flags-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "feature_flags" }, () => { flushAllCaches().catch(() => {}); })
      .subscribe();
    unsubscribeFn = () => { channel.unsubscribe(); supabase.removeChannel(channel); };
  } catch {}
}

export function stopFlagListener(): void { if (unsubscribeFn) { unsubscribeFn(); unsubscribeFn = null; } }
export function isListenerActive(): boolean { return unsubscribeFn !== null; }

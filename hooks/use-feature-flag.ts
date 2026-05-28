"use client";

import { useEffect, useState } from "react";
import { getDefaultFlags } from "@/lib/feature-flags";

const DEFAULT_FLAGS = getDefaultFlags();

const FLAGS_CACHE_TTL = 60_000;

let _cachedFlags: Record<string, boolean> | null = null;
let _cachedAt = 0;

async function fetchFlags(): Promise<Record<string, boolean>> {
    const now = Date.now();
    if (_cachedFlags && now - _cachedAt < FLAGS_CACHE_TTL) {
        return _cachedFlags;
    }

    try {
        const res = await fetch("/api/feature-flags");
        if (res.ok) {
            const flags = (await res.json()) as Record<string, boolean>;
            _cachedFlags = flags;
            _cachedAt = now;
            return flags;
        }
    } catch (err) {
        console.warn("[VG:FeatureFlags] API fetch failed, using defaults:", err);
    }

    return { ...DEFAULT_FLAGS };
}

export function useFeatureFlag(flagName: string, defaultValue: boolean = false) {
    const [isEnabled, setIsEnabled] = useState<boolean>(() => {
        if (_cachedFlags && flagName in _cachedFlags) {
            return _cachedFlags[flagName];
        }
        return DEFAULT_FLAGS[flagName] ?? defaultValue;
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function load() {
            try {
                const flags = await fetchFlags();
                if (isMounted) {
                    setIsEnabled(flags[flagName] ?? defaultValue);
                    setIsLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error(String(err)));
                    setIsEnabled(defaultValue);
                    setIsLoading(false);
                }
            }
        }

        load();

        return () => {
            isMounted = false;
        };
    }, [flagName, defaultValue]);

    return { isEnabled, isLoading };
}

export function useFeatureFlags() {
    const [flags, setFlags] = useState<Record<string, boolean>>(_cachedFlags ?? { ...DEFAULT_FLAGS });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function load() {
            try {
                const result = await fetchFlags();
                if (isMounted) {
                    setFlags(result);
                    setIsLoading(false);
                }
            } catch {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        load();

        return () => {
            isMounted = false;
        };
    }, []);

    return { flags, isLoading };
}

export async function invalidateClientFlagCache(): Promise<void> {
    _cachedFlags = null;
    _cachedAt = 0;
    try {
        await fetch("/api/feature-flags", { method: "POST" });
    } catch (err) {
        console.warn("[VG:FeatureFlags] Invalidation API call failed:", err);
    }
}

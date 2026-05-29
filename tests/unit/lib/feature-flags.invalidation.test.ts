import { describe, it, expect, vi } from "vitest";

const mockDel = vi.fn().mockResolvedValue(1);

vi.mock("@/lib/redis/client", () => ({
    getRedis: () => ({
        del: mockDel,
        ping: vi.fn().mockResolvedValue("PONG"),
    }),
    withRedis: (fn: Function, fallback: any) => fn({ del: mockDel }),
}));

vi.mock("server-only", () => ({}));

describe("Feature Flag Cache Invalidation", () => {
    const REDIS_KEY = "feature_flags";

    it("should invalidate the feature flags cache key via Redis", async () => {
        const { invalidateCache } = await import("@/lib/redis/cache");
        const result = await invalidateCache(REDIS_KEY);
        expect(result).toBe(true);
        expect(mockDel).toHaveBeenCalledWith("vg:cache:feature_flags");
    });

    it("should verify feature flag cache TTL is configured", async () => {
        const { CacheTTL } = await import("@/lib/redis/cache");
        expect(CacheTTL.FEATURE_FLAG).toBe(15 * 60 * 1000);
        expect(CacheTTL.PROFILE).toBe(5 * 60 * 1000);
        expect(CacheTTL.AI_RESPONSE).toBe(60 * 60 * 1000);
        expect(CacheTTL.NOTIFICATION).toBe(1 * 60 * 1000);
    });
});

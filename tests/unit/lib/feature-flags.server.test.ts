import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetCached, mockSetCached, mockInvalidateCache, mockSupabase } = vi.hoisted(() => ({
  mockGetCached: vi.fn(),
  mockSetCached: vi.fn(),
  mockInvalidateCache: vi.fn(),
  mockSupabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
  },
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/redis/cache", () => ({
  getCached: mockGetCached,
  setCached: mockSetCached,
  invalidateCache: mockInvalidateCache,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn().mockResolvedValue(mockSupabase),
}));

import { getFeatureFlags, isFeatureEnabled, invalidateFlagCache } from "@/lib/feature-flags.server";
import { getDefaultFlags } from "@/lib/feature-flags";

describe("feature-flags.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getFeatureFlags", () => {
    it("returns cached flags when Redis hit", async () => {
      const cachedFlags = { premium_tts: false, beta_chat_rooms: true };
      mockGetCached.mockResolvedValue(cachedFlags);

      const result = await getFeatureFlags();

      expect(result).toEqual(cachedFlags);
      expect(mockGetCached).toHaveBeenCalledWith("feature_flags");
    });

    it("checks Redis cache before DB fallback", async () => {
      mockGetCached.mockResolvedValue(null);
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          data: [] as Array<{ name: string; is_enabled: boolean }>,
          error: null,
        }),
      });

      await getFeatureFlags();

      expect(mockGetCached).toHaveBeenCalled();
    });

    it("falls back to DB when Redis cache misses", async () => {
      mockGetCached.mockResolvedValue(null);
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            { name: "premium_tts", is_enabled: false },
            { name: "ai_content_moderation", is_enabled: true },
          ],
          error: null,
        }),
      });
      mockSetCached.mockResolvedValue(true);

      const result = await getFeatureFlags();

      expect(result.premium_tts).toBe(false);
      expect(result.ai_content_moderation).toBe(true);
      expect(mockSetCached).toHaveBeenCalledWith("feature_flags", expect.any(Object), 60000);
    });

    it("returns defaults when DB query fails", async () => {
      mockGetCached.mockResolvedValue(null);
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "DB error" },
        }),
      });

      const result = await getFeatureFlags();
      const defaults = getDefaultFlags();

      expect(result).toEqual(defaults);
    });

    it("returns defaults when DB query throws", async () => {
      mockGetCached.mockResolvedValue(null);
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockRejectedValue(new Error("Connection refused")),
      });

      const result = await getFeatureFlags();
      const defaults = getDefaultFlags();

      expect(result).toEqual(defaults);
    });

    it("writes to cache after successful DB fetch", async () => {
      mockGetCached.mockResolvedValue(null);
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ name: "premium_tts", is_enabled: true }],
          error: null,
        }),
      });

      await getFeatureFlags();

      expect(mockSetCached).toHaveBeenCalledTimes(1);
    });

    it("does not write to cache when DB fails", async () => {
      mockGetCached.mockResolvedValue(null);
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "fail" },
        }),
      });

      await getFeatureFlags();

      expect(mockSetCached).not.toHaveBeenCalled();
    });
  });

  describe("isFeatureEnabled", () => {
    it("returns true for enabled default flag when no cache", async () => {
      mockGetCached.mockResolvedValue(null);
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });
      mockSetCached.mockResolvedValue(true);

      const result = await isFeatureEnabled("premium_tts");

      expect(result).toBe(true);
    });

    it("returns false for disabled default flag when no cache", async () => {
      mockGetCached.mockResolvedValue(null);
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });
      mockSetCached.mockResolvedValue(true);

      const result = await isFeatureEnabled("ai_content_moderation");

      expect(result).toBe(false);
    });

    it("returns cached value when Redis has cache", async () => {
      mockGetCached.mockResolvedValue({ premium_tts: false });

      const result = await isFeatureEnabled("premium_tts");

      expect(result).toBe(false);
    });

    it("returns false for unknown flag ID", async () => {
      mockGetCached.mockResolvedValue(null);
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });
      mockSetCached.mockResolvedValue(true);

      const result = await isFeatureEnabled("non_existent_flag");

      expect(result).toBe(false);
    });

    it("does not hit DB when cache is warm", async () => {
      mockGetCached.mockResolvedValue({ premium_tts: true });

      await isFeatureEnabled("premium_tts");

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("returns false from cache for unknown key", async () => {
      mockGetCached.mockResolvedValue({ premium_tts: true });

      const result = await isFeatureEnabled("unknown_flag");

      expect(result).toBe(false);
    });
  });

  describe("invalidateFlagCache", () => {
    it("calls invalidateCache with the flag key", async () => {
      mockInvalidateCache.mockResolvedValue(true);

      const result = await invalidateFlagCache();

      expect(result).toBe(true);
      expect(mockInvalidateCache).toHaveBeenCalledWith("feature_flags");
    });

    it("returns false when cache invalidation fails", async () => {
      mockInvalidateCache.mockResolvedValue(false);

      const result = await invalidateFlagCache();

      expect(result).toBe(false);
    });
  });
});

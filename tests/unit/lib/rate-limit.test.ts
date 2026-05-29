import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRedisCheckRateLimit, mockSupabase } = vi.hoisted(() => ({
  mockRedisCheckRateLimit: vi.fn(),
  mockSupabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      insert: vi.fn(),
    }),
  },
}));

vi.mock("@/lib/redis/rate-limit", () => ({
  checkRateLimit: mockRedisCheckRateLimit,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn().mockResolvedValue(mockSupabase),
}));

import { checkRateLimit } from "@/lib/rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkRateLimit", () => {
    it("returns Redis result when reset is imminent (< 5s)", async () => {
      const now = Date.now();
      mockRedisCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: now + 3000,
      });

      const result = await checkRateLimit("user-1", "post_create");

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("returns Redis result when not allowed", async () => {
      const now = Date.now();
      mockRedisCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: now + 30000,
      });

      const result = await checkRateLimit("user-1", "post_create");

      expect(result.allowed).toBe(false);
    });

    it("falls back to DB when Redis says allowed with enough time", async () => {
      const now = Date.now();
      mockRedisCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 9,
        resetAt: now + 30000,
      });
      mockSupabase.from().select().eq().gte.mockResolvedValue({
        data: null,
        count: 5,
        error: null,
      });
      mockSupabase.from().insert.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await checkRateLimit("user-1", "post_create");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(mockSupabase.from).toHaveBeenCalled();
    });

    it("blocks request when DB count exceeds max", async () => {
      const now = Date.now();
      mockRedisCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 0,
        resetAt: now + 30000,
      });
      mockSupabase.from().select().eq().gte.mockResolvedValue({
        data: null,
        count: 10,
        error: null,
      });

      const result = await checkRateLimit("user-1", "post_create");

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("allows request when DB count is under max", async () => {
      const now = Date.now();
      mockRedisCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetAt: now + 30000,
      });
      mockSupabase.from().select().eq().gte.mockResolvedValue({
        data: null,
        count: 3,
        error: null,
      });
      mockSupabase.from().insert.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await checkRateLimit("user-1", "post_create");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(7);
    });

    it("returns open limit for unknown action", async () => {
      const now = Date.now();
      mockRedisCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 999,
        resetAt: now + 30000,
      });

      const result = await checkRateLimit("user-1", "unknown_action" as "post_create");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(999);
    });

    it("inserts rate limit record on allowed request", async () => {
      const now = Date.now();
      mockRedisCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 9,
        resetAt: now + 30000,
      });
      mockSupabase.from().select().eq().gte.mockResolvedValue({
        data: null,
        count: 2,
        error: null,
      });
      mockSupabase.from().insert.mockResolvedValue({
        data: null,
        error: null,
      });

      await checkRateLimit("user-1", "post_create");

      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        user_id: "user-1",
        action: "post_create",
        ip_address: null,
      });
    });

    it("does not insert on blocked request", async () => {
      const now = Date.now();
      mockRedisCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 0,
        resetAt: now + 30000,
      });
      mockSupabase.from().select().eq().gte.mockResolvedValue({
        data: null,
        count: 10,
        error: null,
      });

      await checkRateLimit("user-1", "post_create");

      expect(mockSupabase.from().insert).not.toHaveBeenCalled();
    });

    it("handles auth_login limit of 5 per 5 minutes", async () => {
      const now = Date.now();
      mockRedisCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetAt: now + 30000,
      });
      mockSupabase.from().select().eq().gte.mockResolvedValue({
        data: null,
        count: 5,
        error: null,
      });

      const result = await checkRateLimit("user-1", "auth_login");

      expect(result.allowed).toBe(false);
    });

    it("handles auth_signup limit of 3 per hour", async () => {
      const now = Date.now();
      mockRedisCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 2,
        resetAt: now + 30000,
      });
      mockSupabase.from().select().eq().gte.mockResolvedValue({
        data: null,
        count: 2,
        error: null,
      });
      mockSupabase.from().insert.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await checkRateLimit("user-1", "auth_signup");

      expect(result.allowed).toBe(true);
    });

    it("verifies all defined rate limit actions work", async () => {
      const now = Date.now();
      mockRedisCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 999,
        resetAt: now + 30000,
      });

      const configKeys = ["post_create", "comment_create", "message_send", "like", "follow", "auth_login", "auth_signup"];
      for (const action of configKeys) {
        const chain = mockSupabase.from();
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.gte = vi.fn().mockResolvedValue({ data: null, count: 0, error: null });
        chain.insert = vi.fn().mockResolvedValue({ data: null, error: null });

        const result = await checkRateLimit("user-1", action as "post_create");
        expect(result, `action=${action}`).toBeDefined();
      }
    });
  });
});

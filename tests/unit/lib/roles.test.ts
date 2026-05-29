import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuthGetUser, mockSupabaseClient, mockCreateClient, mockCreateServerClient } = vi.hoisted(() => {
  const authGetUser = vi.fn();

  const fromMethod = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  });

  const supabaseClient = {
    auth: { getUser: authGetUser },
    from: fromMethod,
  };

  return {
    mockAuthGetUser: authGetUser,
    mockSupabaseClient: supabaseClient,
    mockCreateClient: vi.fn().mockReturnValue(supabaseClient),
    mockCreateServerClient: vi.fn().mockResolvedValue(supabaseClient),
  };
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateServerClient,
  createServerClient: mockCreateServerClient,
}));

import { isArtist, isArtistServer, isAdmin, isAdminServer, getUserRoles, getUserRolesServer } from "@/lib/roles";

describe("roles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isArtist (client-side)", () => {
    it("returns false when no userId provided and no auth user", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await isArtist();

      expect(result).toBe(false);
    });

    it("returns true when profile is_artist is true", async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValue({
        data: { is_artist: true },
        error: null,
      });

      const result = await isArtist("user-123");

      expect(result).toBe(true);
    });

    it("returns false when profile is_artist is false", async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValue({
        data: { is_artist: false },
        error: null,
      });

      const result = await isArtist("user-123");

      expect(result).toBe(false);
    });

    it("returns false when profile not found", async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValue({
        data: null,
        error: { message: "No rows" },
      });

      const result = await isArtist("user-123");

      expect(result).toBe(false);
    });

    it("resolves userId from auth when not provided", async () => {
      mockAuthGetUser.mockResolvedValue({
        data: { user: { id: "auth-user-456" } },
        error: null,
      });
      mockSupabaseClient.from().eq().single.mockResolvedValue({
        data: { is_artist: true },
        error: null,
      });

      const result = await isArtist();

      expect(result).toBe(true);
      expect(mockAuthGetUser).toHaveBeenCalled();
    });
  });

  describe("isArtistServer (server-side)", () => {
    it("returns true when server profile is_artist is true", async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValue({
        data: { is_artist: true },
        error: null,
      });

      const result = await isArtistServer("user-123");

      expect(result).toBe(true);
      expect(mockCreateServerClient).toHaveBeenCalled();
    });

    it("returns false when no userId", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await isArtistServer();

      expect(result).toBe(false);
    });
  });

  describe("isAdmin (client-side)", () => {
    it("returns true when profile is_admin is true", async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValue({
        data: { is_admin: true },
        error: null,
      });

      const result = await isAdmin("user-123");

      expect(result).toBe(true);
    });

    it("returns false when profile is_admin is false", async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValue({
        data: { is_admin: false },
        error: null,
      });

      const result = await isAdmin("user-123");

      expect(result).toBe(false);
    });

    it("returns false when profile not found", async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValue({
        data: null,
        error: { message: "No rows" },
      });

      const result = await isAdmin("user-123");

      expect(result).toBe(false);
    });
  });

  describe("isAdminServer (server-side)", () => {
    it("returns true when server profile is_admin is true", async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValue({
        data: { is_admin: true },
        error: null,
      });

      const result = await isAdminServer("user-123");

      expect(result).toBe(true);
    });
  });

  describe("getUserRoles (client-side)", () => {
    it("returns default roles when no userId and no auth", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await getUserRoles();

      expect(result).toEqual({
        isArtist: false,
        isAdmin: false,
        artistProfile: null,
      });
    });

    it("returns correct roles for full profile", async () => {
      const singleMock = vi.fn()
        .mockResolvedValueOnce({
          data: { is_artist: true, is_admin: false },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "ap-1", user_id: "user-123", artist_name: "TestArtist", specialties: [], commission_status: "open", social_links: {} },
          error: null,
        });

      const fromFn = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: singleMock,
          }),
        }),
      });

      mockSupabaseClient.from = fromFn;

      const result = await getUserRoles("user-123");

      expect(result.isArtist).toBe(true);
      expect(result.isAdmin).toBe(false);
      expect(result.artistProfile).not.toBeNull();
    });
  });

  describe("getUserRolesServer (server-side)", () => {
    it("returns default roles when no userId and no auth", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await getUserRolesServer();

      expect(result).toEqual({
        isArtist: false,
        isAdmin: false,
        artistProfile: null,
      });
    });
  });
});

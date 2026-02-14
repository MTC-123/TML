import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock getEnv before importing client
vi.mock("@/lib/config", () => ({
  getEnv: () => ({
    NEXT_PUBLIC_API_URL: "http://localhost:3000",
    NEXT_PUBLIC_APP_URL: "http://localhost:3001",
    NEXT_PUBLIC_DEFAULT_LOCALE: "fr",
  }),
}));

import { api, setTokenAccessor } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

describe("api client", () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchSpy);
    fetchSpy.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    // Clear token accessor
    setTokenAccessor({
      getAccessToken: () => null,
      getRefreshToken: () => null,
      setTokens: vi.fn(),
      clearTokens: vi.fn(),
    });
  });

  it("adds auth token to requests", async () => {
    setTokenAccessor({
      getAccessToken: () => "test-token",
      getRefreshToken: () => "refresh",
      setTokens: vi.fn(),
      clearTokens: vi.fn(),
    });

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: "ok" }), { status: 200 }),
    );

    await api.get("/projects");

    const [, init] = fetchSpy.mock.calls[0];
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("refreshes token on 401 and retries", async () => {
    const setTokens = vi.fn();
    setTokenAccessor({
      getAccessToken: () => "expired-token",
      getRefreshToken: () => "valid-refresh",
      setTokens,
      clearTokens: vi.fn(),
    });

    // First call returns 401
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
    );

    // Refresh call succeeds
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accessToken: "new-access",
          refreshToken: "new-refresh",
        }),
        { status: 200 },
      ),
    );

    // Retry call succeeds
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: "success" }), { status: 200 }),
    );

    const result = await api.get<{ data: string }>("/projects");
    expect(result.data).toBe("success");
    expect(setTokens).toHaveBeenCalledWith("new-access", "new-refresh");
  });

  it("throws ApiError on 4xx responses", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "Bad Request",
          code: "VALIDATION_ERROR",
          statusCode: 400,
        }),
        { status: 400 },
      ),
    );

    await expect(api.get("/bad")).rejects.toThrow(ApiError);
    try {
      await api.get("/bad");
    } catch (e) {
      // Already asserted above
    }
  });

  it("throws ApiError with NETWORK_ERROR on fetch failure", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("Network failure"));

    try {
      await api.get("/fail");
      expect.fail("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).code).toBe("NETWORK_ERROR");
    }
  });

  it("sends JSON body on POST", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: "created" }), { status: 201 }),
    );

    await api.post("/projects", { name: "Test" });

    const [, init] = fetchSpy.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "Test" }));
  });
});

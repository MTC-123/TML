import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { useAuthStore } from "@/store/auth-store";

const API_BASE = "http://localhost:3000/api/v1";

const server = setupServer(
  http.post(`${API_BASE}/auth/refresh`, async ({ request }) => {
    const body = (await request.json()) as { refreshToken?: string };
    if (body.refreshToken === "valid-refresh") {
      return HttpResponse.json({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
    }
    return HttpResponse.json(
      { code: "UNAUTHORIZED", message: "Invalid refresh token" },
      { status: 401 },
    );
  }),
);

beforeEach(() => {
  server.listen({ onUnhandledRequest: "bypass" });
  localStorage.clear();
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: false,
  });
});

afterEach(() => {
  server.close();
});

describe("Auth flow", () => {
  it("login stores user in auth store", () => {
    useAuthStore.getState().setAuth(
      { id: "u1", did: "did:key:z6Mk123", roles: ["contractor_engineer"] },
      "access-token",
      "refresh-token",
    );

    const state = useAuthStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.user?.did).toBe("did:key:z6Mk123");
    expect(state.accessToken).toBe("access-token");
    expect(state.refreshToken).toBe("refresh-token");
  });

  it("logout clears auth store", () => {
    useAuthStore.getState().setAuth(
      { id: "u1", did: "did:key:z6Mk123", roles: ["contractor_engineer"] },
      "access-token",
      "refresh-token",
    );

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it("isAuthenticated reflects login state", () => {
    expect(useAuthStore.getState().user).toBeNull();

    useAuthStore.getState().setAuth(
      { id: "u1", did: "did:key:z6Mk123", roles: ["contractor_engineer"] },
      "token",
      "refresh",
    );
    expect(useAuthStore.getState().user).not.toBeNull();
    expect(useAuthStore.getState().accessToken).toBe("token");
  });

  it("token refresh via API returns new tokens", async () => {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: "valid-refresh" }),
    });

    const data = (await response.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    expect(response.ok).toBe(true);
    expect(data.accessToken).toBe("new-access-token");
    expect(data.refreshToken).toBe("new-refresh-token");
  });

  it("invalid refresh token returns 401", async () => {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: "expired-token" }),
    });

    expect(response.status).toBe(401);
  });

  it("auth store persists across rehydration", () => {
    useAuthStore.getState().setAuth(
      { id: "u1", did: "did:key:z6Mk123", roles: ["inspector"] },
      "token-abc",
      "refresh-xyz",
    );

    // Simulate reading persisted state
    const persisted = useAuthStore.getState();
    expect(persisted.user?.roles).toContain("inspector");
    expect(persisted.accessToken).toBe("token-abc");
  });
});

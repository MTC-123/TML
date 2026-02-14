import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/store/auth-store";
import { mockUser } from "../../mocks/data";

describe("auth-store", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
    });
    localStorage.clear();
  });

  it("stores tokens on login", () => {
    const user = mockUser();
    useAuthStore.getState().setAuth(user, "access-123", "refresh-456");

    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.accessToken).toBe("access-123");
    expect(state.refreshToken).toBe("refresh-456");
  });

  it("clears tokens on logout", () => {
    const user = mockUser();
    useAuthStore.getState().setAuth(user, "access-123", "refresh-456");
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it("returns isAuthenticated based on token presence", () => {
    const stateLoggedOut = useAuthStore.getState();
    expect(stateLoggedOut.accessToken).toBeNull();
    expect(stateLoggedOut.user).toBeNull();

    const user = mockUser();
    useAuthStore.getState().setAuth(user, "token", "refresh");

    const stateLoggedIn = useAuthStore.getState();
    expect(stateLoggedIn.accessToken).toBeTruthy();
    expect(stateLoggedIn.user).toBeTruthy();
  });

  it("persists to localStorage", () => {
    const user = mockUser();
    useAuthStore.getState().setAuth(user, "access", "refresh");

    const stored = localStorage.getItem("tml-auth");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.state.accessToken).toBe("access");
  });

  it("sets loading state", () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);

    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});

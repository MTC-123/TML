import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuthStore } from "@/store/auth-store";

describe("AuthGuard", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
    });
  });

  it("renders children when authenticated with correct role", () => {
    useAuthStore.setState({
      user: {
        id: "u1",
        did: "did:key:z6Mk...",
        roles: ["admin"],
      },
      accessToken: "token",
      refreshToken: "refresh",
      isLoading: false,
    });

    render(
      <AuthGuard requiredRoles={["admin"]}>
        <p>Protected Content</p>
      </AuthGuard>,
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("does not render children when not authenticated", () => {
    render(
      <AuthGuard>
        <p>Protected Content</p>
      </AuthGuard>,
    );

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("shows 403 when wrong role", () => {
    useAuthStore.setState({
      user: {
        id: "u1",
        did: "did:key:z6Mk...",
        roles: ["citizen"],
      },
      accessToken: "token",
      refreshToken: "refresh",
      isLoading: false,
    });

    render(
      <AuthGuard requiredRoles={["admin"]}>
        <p>Admin Only</p>
      </AuthGuard>,
    );

    expect(screen.queryByText("Admin Only")).not.toBeInTheDocument();
    expect(screen.getByText("403 — Access Denied")).toBeInTheDocument();
  });

  it("shows loading spinner while hydrating", () => {
    useAuthStore.setState({ isLoading: true });

    const { container } = render(
      <AuthGuard>
        <p>Content</p>
      </AuthGuard>,
    );

    expect(screen.queryByText("Content")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });
});

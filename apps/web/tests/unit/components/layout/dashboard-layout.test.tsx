import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock AuthGuard to not block rendering
vi.mock("@/components/auth/auth-guard", () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock LogoutButton
vi.mock("@/components/auth/logout-button", () => ({
  LogoutButton: () => <button>Logout</button>,
}));

// Mock LanguageSwitcher
vi.mock("@/components/layout/language-switcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Lang</div>,
}));

// Mock Sheet components (mobile sidebar)
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-content">{children}</div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import DashboardLayout from "@/app/[locale]/(dashboard)/layout";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

describe("DashboardLayout", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: "u1", did: "did:key:z6Mk123", roles: ["contractor_engineer"] },
      accessToken: "token",
      refreshToken: "refresh",
      isLoading: false,
    });
    useUiStore.setState({
      sidebarCollapsed: false,
      mobileNavOpen: false,
    });
  });

  it("renders TML wordmark", () => {
    render(<DashboardLayout>Content</DashboardLayout>);
    const wordmarks = screen.getAllByText("TML");
    expect(wordmarks.length).toBeGreaterThanOrEqual(1);
  });

  it("renders all navigation items", () => {
    render(<DashboardLayout>Content</DashboardLayout>);
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Projects").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Attestations").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Certificates").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Disputes").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Admin").length).toBeGreaterThanOrEqual(1);
  });

  it("renders children content", () => {
    render(<DashboardLayout><div>Page Content</div></DashboardLayout>);
    expect(screen.getByText("Page Content")).toBeInTheDocument();
  });

  it("renders language switcher", () => {
    render(<DashboardLayout>Content</DashboardLayout>);
    expect(screen.getByTestId("language-switcher")).toBeInTheDocument();
  });

  it("does not contain Claude or Anthropic text", () => {
    const { container } = render(<DashboardLayout>Content</DashboardLayout>);
    const html = container.innerHTML;
    expect(html).not.toMatch(/claude/i);
    expect(html).not.toMatch(/anthropic/i);
  });

  it("toggles sidebar collapsed state", async () => {
    const user = userEvent.setup();
    render(<DashboardLayout>Content</DashboardLayout>);

    // Initially not collapsed - TML wordmark should be visible in sidebar
    const wordmarks = screen.getAllByText("TML");
    expect(wordmarks.length).toBeGreaterThanOrEqual(2); // sidebar + mobile header

    // Toggle sidebar
    useUiStore.setState({ sidebarCollapsed: true });
    render(<DashboardLayout>Content</DashboardLayout>);
  });
});

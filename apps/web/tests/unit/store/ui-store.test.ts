import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "@/store/ui-store";

describe("ui-store", () => {
  beforeEach(() => {
    useUiStore.setState({ sidebarCollapsed: false, mobileNavOpen: false });
  });

  it("toggles sidebar collapsed state", () => {
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);

    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);

    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });

  it("sets mobile nav open state", () => {
    expect(useUiStore.getState().mobileNavOpen).toBe(false);

    useUiStore.getState().setMobileNavOpen(true);
    expect(useUiStore.getState().mobileNavOpen).toBe(true);

    useUiStore.getState().setMobileNavOpen(false);
    expect(useUiStore.getState().mobileNavOpen).toBe(false);
  });
});

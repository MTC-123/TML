import { describe, it, expect, vi, beforeEach } from "vitest";

describe("getEnv", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("parses valid environment variables", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3000");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3001");

    const { getEnv } = await import("@/lib/config");
    const env = getEnv();

    expect(env.NEXT_PUBLIC_API_URL).toBe("http://localhost:3000");
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3001");
    expect(env.NEXT_PUBLIC_DEFAULT_LOCALE).toBe("fr");
  });

  it("uses defaults when optional vars are missing", async () => {
    // Clear all env vars to use defaults
    vi.stubEnv("NEXT_PUBLIC_API_URL", undefined as unknown as string);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined as unknown as string);

    const { getEnv } = await import("@/lib/config");
    const env = getEnv();

    expect(env.NEXT_PUBLIC_API_URL).toBe("http://localhost:3000");
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3001");
  });
});

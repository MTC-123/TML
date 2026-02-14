import { describe, it, expect } from "vitest";
import { formatMAD, formatMADCompact, parseMAD } from "@/lib/formatters/currency";

describe("formatMAD", () => {
  it("formats MAD currency correctly", () => {
    const result = formatMAD(1500);
    expect(result).toContain("MAD");
    expect(result).toMatch(/1[\s.,]?500/);
  });

  it("handles zero", () => {
    const result = formatMAD(0);
    expect(result).toContain("0");
    expect(result).toContain("MAD");
  });

  it("handles negative values", () => {
    const result = formatMAD(-500);
    expect(result).toContain("500");
    expect(result).toContain("MAD");
  });

  it("handles string input (Prisma Decimal)", () => {
    const result = formatMAD("2500.50");
    expect(result).toContain("MAD");
    expect(result).toMatch(/2[\s.,]?500/);
  });

  it("returns placeholder for NaN", () => {
    expect(formatMAD("not-a-number")).toBe("— MAD");
    expect(formatMAD(NaN)).toBe("— MAD");
  });
});

describe("formatMADCompact", () => {
  it("formats large amounts compactly", () => {
    const result = formatMADCompact(1200000);
    expect(result).toContain("MAD");
  });

  it("returns placeholder for NaN", () => {
    expect(formatMADCompact("xyz")).toBe("— MAD");
  });
});

describe("parseMAD", () => {
  it("parses numeric value from formatted string", () => {
    const result = parseMAD("1 500,00 MAD");
    expect(result).toBeGreaterThan(0);
  });

  it("returns NaN for unparseable input", () => {
    expect(parseMAD("")).toBeNaN();
  });
});

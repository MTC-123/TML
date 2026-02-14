import { describe, it, expect, vi, afterEach } from "vitest";
import {
  formatDate,
  formatDateShort,
  formatDateTime,
  formatRelativeTime,
} from "@/lib/formatters/date";

describe("formatDate", () => {
  it("formats dates as full date string", () => {
    const result = formatDate("2026-02-10T12:00:00Z");
    expect(result).toContain("February");
    expect(result).toContain("10");
    expect(result).toContain("2026");
  });

  it("accepts Date objects", () => {
    const result = formatDate(new Date("2026-06-15T00:00:00Z"));
    expect(result).toContain("2026");
  });

  it("returns Invalid date for bad input", () => {
    expect(formatDate("garbage")).toBe("Invalid date");
  });
});

describe("formatDateShort", () => {
  it("formats dates as short date string", () => {
    const result = formatDateShort("2026-02-10T12:00:00Z");
    expect(result).toContain("Feb");
    expect(result).toContain("10");
    expect(result).toContain("2026");
  });

  it("returns Invalid date for bad input", () => {
    expect(formatDateShort("xyz")).toBe("Invalid date");
  });
});

describe("formatDateTime", () => {
  it("formats date with time and timezone", () => {
    const result = formatDateTime("2026-02-10T14:30:00Z");
    expect(result).toContain("2026");
    expect(result).toContain("UTC");
  });

  it("returns Invalid date for bad input", () => {
    expect(formatDateTime("bad")).toBe("Invalid date");
  });
});

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats time in the past as 'ago'", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-14T12:00:00Z"));
    const result = formatRelativeTime("2026-02-14T10:00:00Z");
    expect(result).toContain("2");
    expect(result).toContain("hour");
  });

  it("formats time in the future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-14T12:00:00Z"));
    const result = formatRelativeTime("2026-02-17T12:00:00Z");
    expect(result).toContain("3");
    expect(result).toContain("day");
  });

  it("returns Invalid date for bad input", () => {
    expect(formatRelativeTime("not-a-date")).toBe("Invalid date");
  });
});

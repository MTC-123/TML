import { describe, it, expect } from "vitest";
import {
  haversineDistance,
  formatDistance,
  isWithinRadius,
  formatCoordinates,
} from "@/lib/formatters/distance";

describe("haversineDistance", () => {
  it("calculates distance between two GPS coordinates", () => {
    // Rabat to Casablanca (~87 km)
    const distance = haversineDistance(34.0209, -6.8416, 33.5731, -7.5898);
    expect(distance).toBeGreaterThan(80);
    expect(distance).toBeLessThan(100);
  });

  it("returns 0 for same coordinates", () => {
    const distance = haversineDistance(34.0209, -6.8416, 34.0209, -6.8416);
    expect(distance).toBe(0);
  });

  it("handles antipodal points", () => {
    const distance = haversineDistance(0, 0, 0, 180);
    expect(distance).toBeGreaterThan(20000);
  });
});

describe("formatDistance", () => {
  it("formats kilometers for distances >= 10 km", () => {
    expect(formatDistance(15)).toBe("15 km");
  });

  it("formats with decimal for distances 1-10 km", () => {
    expect(formatDistance(1.5)).toBe("1.5 km");
  });

  it("formats in meters for distances < 1 km", () => {
    expect(formatDistance(0.25)).toBe("250 m");
  });

  it("formats very small distances", () => {
    expect(formatDistance(0.0005)).toBe("< 1 m");
  });
});

describe("isWithinRadius", () => {
  it("returns true when point is inside geofence", () => {
    // Same point, 1 km radius
    expect(isWithinRadius(34.0209, -6.8416, 34.0209, -6.8416, 1)).toBe(true);
  });

  it("returns false when point is outside geofence", () => {
    // Rabat to Casablanca, 10 km radius
    expect(isWithinRadius(34.0209, -6.8416, 33.5731, -7.5898, 10)).toBe(false);
  });

  it("returns true for point exactly on the boundary", () => {
    const distance = haversineDistance(34.0, -6.8, 34.01, -6.8);
    expect(isWithinRadius(34.0, -6.8, 34.01, -6.8, distance)).toBe(true);
  });
});

describe("formatCoordinates", () => {
  it("formats N/E coordinates", () => {
    expect(formatCoordinates(33.9716, 6.8498)).toBe("33.971600N, 6.849800E");
  });

  it("formats S/W coordinates", () => {
    expect(formatCoordinates(-33.9716, -6.8498)).toBe("33.971600S, 6.849800W");
  });

  it("handles string inputs", () => {
    expect(formatCoordinates("33.9716", "-6.8498")).toBe(
      "33.971600N, 6.849800W",
    );
  });

  it("returns Invalid coordinates for NaN", () => {
    expect(formatCoordinates("bad", "data")).toBe("Invalid coordinates");
  });
});

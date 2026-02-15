/**
 * Haversine distance between two GPS coordinates in meters.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Format distance with human-readable units.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Check if a point is within a given radius (meters).
 */
export function isWithinRadius(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radius: number,
): boolean {
  return haversineDistance(lat1, lng1, lat2, lng2) <= radius;
}

/**
 * Format GPS coordinates.
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`;
}

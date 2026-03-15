/**
 * GPS distance calculation and formatting utilities.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians.
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate the Haversine distance between two GPS coordinates.
 * Returns distance in kilometers.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Format a distance in kilometers to a human-readable string.
 * Under 1 km, displays in meters.
 */
export function formatDistance(km: number): string {
  if (km < 0.001) return "< 1 m";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/**
 * Check whether a GPS coordinate falls within a given radius (in km) of a center point.
 */
export function isWithinRadius(
  centerLat: number,
  centerLng: number,
  pointLat: number,
  pointLng: number,
  radiusKm: number,
): boolean {
  return haversineDistance(centerLat, centerLng, pointLat, pointLng) <= radiusKm;
}

/**
 * Format GPS coordinates to a human-readable string.
 */
export function formatCoordinates(
  lat: number | string,
  lng: number | string,
): string {
  const latNum = typeof lat === "string" ? parseFloat(lat) : lat;
  const lngNum = typeof lng === "string" ? parseFloat(lng) : lng;
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return "Invalid coordinates";

  const latDir = latNum >= 0 ? "N" : "S";
  const lngDir = lngNum >= 0 ? "E" : "W";
  return `${Math.abs(latNum).toFixed(6)}${latDir}, ${Math.abs(lngNum).toFixed(6)}${lngDir}`;
}

"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeofenceArea {
  center: { latitude: number; longitude: number };
  radiusKm: number;
  name: string;
}

export type GeolocationStatus =
  | "idle"
  | "requesting"
  | "acquired"
  | "denied"
  | "unavailable"
  | "timeout";

export interface UseGeolocationResult {
  position: GeolocationPosition | null;
  status: GeolocationStatus;
  error: string | null;
  requestPosition: () => void;
  isWithinGeofence: (geofence: GeofenceArea) => boolean;
}

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useGeolocation(): UseGeolocationResult {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const requestPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("unavailable");
      setError("Geolocation is not supported by this browser");
      return;
    }

    setStatus("requesting");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setStatus("acquired");
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setStatus("denied");
            setError("Location permission denied");
            break;
          case err.POSITION_UNAVAILABLE:
            setStatus("unavailable");
            setError("Location information unavailable");
            break;
          case err.TIMEOUT:
            setStatus("timeout");
            setError("Location request timed out");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      },
    );
  }, []);

  const isWithinGeofence = useCallback(
    (geofence: GeofenceArea): boolean => {
      if (!position) return false;
      const distance = haversineDistanceKm(
        position.latitude,
        position.longitude,
        geofence.center.latitude,
        geofence.center.longitude,
      );
      return distance <= geofence.radiusKm;
    },
    [position],
  );

  useEffect(() => {
    const id = watchIdRef.current;
    return () => {
      if (id !== null) {
        navigator.geolocation.clearWatch(id);
      }
    };
  }, []);

  return { position, status, error, requestPosition, isWithinGeofence };
}

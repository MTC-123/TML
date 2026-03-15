"use client";

import { MapPin, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { useAttestationStore } from "@/store/attestation-store";
import { useEffect } from "react";

export function GpsLocationPicker() {
  const { position, status, error, requestPosition } = useGeolocation();
  const setGpsCoords = useAttestationStore((s) => s.setGpsCoords);
  const gpsCoords = useAttestationStore((s) => s.gpsCoords);

  useEffect(() => {
    if (position) {
      setGpsCoords({
        latitude: position.latitude,
        longitude: position.longitude,
      });
    }
  }, [position, setGpsCoords]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8">
        <MapPin className="h-12 w-12 text-[#1e3a5f]" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Capture GPS Location</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your location is required to verify you are at the project site.
          </p>
        </div>
        <Button
          onClick={requestPosition}
          disabled={status === "requesting"}
          className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90"
        >
          {status === "requesting" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Acquiring Location...
            </>
          ) : gpsCoords ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Re-capture Location
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Capture My Location
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {gpsCoords && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-[#2d8a4e]" />
            <span className="text-sm font-medium text-[#2d8a4e]">Location Acquired</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Latitude</span>
              <p className="font-mono font-medium">{gpsCoords.latitude.toFixed(7)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Longitude</span>
              <p className="font-mono font-medium">{gpsCoords.longitude.toFixed(7)}</p>
            </div>
          </div>
          {position?.accuracy && (
            <p className="text-xs text-muted-foreground mt-2">
              Accuracy: ~{Math.round(position.accuracy)}m
            </p>
          )}
        </div>
      )}
    </div>
  );
}

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { useAttestationStore } from "@/store/attestation-store";
import { mockAttestation } from "../mocks/data";

const API_BASE = "http://localhost:3000/api/v1";

const server = setupServer(
  http.post(`${API_BASE}/attestations`, async ({ request }) => {
    const body = (await request.json()) as {
      milestoneId?: string;
      gpsLatitude?: number;
      gpsLongitude?: number;
    };

    // Simulate geofence check — reject if outside project area
    if (body.gpsLatitude && body.gpsLatitude > 90) {
      return HttpResponse.json(
        { code: "GEOFENCE_VIOLATION", message: "Location outside project boundary" },
        { status: 422 },
      );
    }

    if (!body.milestoneId) {
      return HttpResponse.json(
        { code: "VALIDATION_ERROR", message: "milestoneId is required" },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      { data: mockAttestation({ milestoneId: body.milestoneId, status: "submitted" }) },
      { status: 201 },
    );
  }),
);

beforeEach(() => {
  server.listen({ onUnhandledRequest: "bypass" });
  useAttestationStore.getState().reset();
});

afterEach(() => {
  server.close();
});

describe("Attestation submission flow", () => {
  it("wizard step progression updates store", () => {
    const store = useAttestationStore.getState();
    expect(store.currentStep).toBe(0);

    store.setStep(1);
    expect(useAttestationStore.getState().currentStep).toBe(1);

    store.setStep(2);
    expect(useAttestationStore.getState().currentStep).toBe(2);

    store.setStep(3);
    expect(useAttestationStore.getState().currentStep).toBe(3);
  });

  it("stores GPS coordinates", () => {
    useAttestationStore.getState().setGpsCoords({ latitude: 33.97, longitude: -6.85 });
    const coords = useAttestationStore.getState().gpsCoords;
    expect(coords?.latitude).toBeCloseTo(33.97);
    expect(coords?.longitude).toBeCloseTo(-6.85);
  });

  it("submits attestation successfully", async () => {
    const res = await fetch(`${API_BASE}/attestations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        milestoneId: "ms-001",
        gpsLatitude: 33.97,
        gpsLongitude: -6.85,
        type: "inspector_verification",
      }),
    });

    const json = (await res.json()) as { data: { status: string; milestoneId: string } };
    expect(res.status).toBe(201);
    expect(json.data.status).toBe("submitted");
    expect(json.data.milestoneId).toBe("ms-001");
  });

  it("rejects submission outside geofence", async () => {
    const res = await fetch(`${API_BASE}/attestations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        milestoneId: "ms-001",
        gpsLatitude: 999, // invalid
        gpsLongitude: -6.85,
      }),
    });

    expect(res.status).toBe(422);
    const json = (await res.json()) as { code: string };
    expect(json.code).toBe("GEOFENCE_VIOLATION");
  });

  it("rejects submission without milestoneId", async () => {
    const res = await fetch(`${API_BASE}/attestations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gpsLatitude: 33.97, gpsLongitude: -6.85 }),
    });

    expect(res.status).toBe(400);
    const json = (await res.json()) as { code: string };
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  it("stores evidence files and signature in wizard", () => {
    const store = useAttestationStore.getState();
    store.setMilestoneId("ms-001");
    store.setGpsCoords({ latitude: 33.97, longitude: -6.85 });
    store.setSignature("sig-abc123");
    store.setNotes("All foundations inspected");

    const state = useAttestationStore.getState();
    expect(state.milestoneId).toBe("ms-001");
    expect(state.signature).toBe("sig-abc123");
    expect(state.notes).toBe("All foundations inspected");
  });

  it("reset clears all wizard state", () => {
    const store = useAttestationStore.getState();
    store.setStep(3);
    store.setMilestoneId("ms-001");
    store.setSignature("sig");
    store.setNotes("note");

    store.reset();

    const state = useAttestationStore.getState();
    expect(state.currentStep).toBe(0);
    expect(state.milestoneId).toBeNull();
    expect(state.signature).toBeNull();
    expect(state.notes).toBe("");
  });
});

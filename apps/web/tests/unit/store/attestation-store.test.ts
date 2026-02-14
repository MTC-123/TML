import { describe, it, expect, beforeEach } from "vitest";
import { useAttestationStore } from "@/store/attestation-store";

describe("attestation-store", () => {
  beforeEach(() => {
    useAttestationStore.getState().reset();
  });

  it("advances through steps", () => {
    expect(useAttestationStore.getState().currentStep).toBe(0);

    useAttestationStore.getState().setStep(1);
    expect(useAttestationStore.getState().currentStep).toBe(1);

    useAttestationStore.getState().setStep(2);
    expect(useAttestationStore.getState().currentStep).toBe(2);

    useAttestationStore.getState().setStep(3);
    expect(useAttestationStore.getState().currentStep).toBe(3);
  });

  it("stores GPS coordinates", () => {
    expect(useAttestationStore.getState().gpsCoords).toBeNull();

    const coords = { latitude: 33.9716, longitude: -6.8498 };
    useAttestationStore.getState().setGpsCoords(coords);
    expect(useAttestationStore.getState().gpsCoords).toEqual(coords);
  });

  it("adds and removes evidence files", () => {
    const file1 = new File(["photo1"], "photo1.jpg", { type: "image/jpeg" });
    const file2 = new File(["photo2"], "photo2.jpg", { type: "image/jpeg" });

    useAttestationStore.getState().setEvidenceFiles([file1, file2]);
    expect(useAttestationStore.getState().evidenceFiles).toHaveLength(2);

    useAttestationStore.getState().setEvidenceFiles([file1]);
    expect(useAttestationStore.getState().evidenceFiles).toHaveLength(1);
  });

  it("stores milestone ID", () => {
    useAttestationStore.getState().setMilestoneId("ms-001");
    expect(useAttestationStore.getState().milestoneId).toBe("ms-001");
  });

  it("stores signature", () => {
    useAttestationStore.getState().setSignature("abcdef123456");
    expect(useAttestationStore.getState().signature).toBe("abcdef123456");
  });

  it("stores notes", () => {
    useAttestationStore.getState().setNotes("Inspection completed");
    expect(useAttestationStore.getState().notes).toBe("Inspection completed");
  });

  it("resets all state", () => {
    useAttestationStore.getState().setStep(3);
    useAttestationStore
      .getState()
      .setGpsCoords({ latitude: 34, longitude: -6 });
    useAttestationStore
      .getState()
      .setEvidenceFiles([new File(["x"], "x.jpg", { type: "image/jpeg" })]);
    useAttestationStore.getState().setSignature("sig");
    useAttestationStore.getState().setNotes("note");
    useAttestationStore.getState().setMilestoneId("ms-1");

    useAttestationStore.getState().reset();

    const state = useAttestationStore.getState();
    expect(state.currentStep).toBe(0);
    expect(state.gpsCoords).toBeNull();
    expect(state.evidenceFiles).toHaveLength(0);
    expect(state.signature).toBeNull();
    expect(state.notes).toBe("");
    expect(state.milestoneId).toBeNull();
  });
});

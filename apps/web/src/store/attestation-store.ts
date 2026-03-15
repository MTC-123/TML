"use client";

import { create } from "zustand";

interface AttestationState {
  currentStep: number;
  milestoneId: string | null;
  gpsCoords: { latitude: number; longitude: number } | null;
  evidenceFiles: File[];
  signature: string | null;
  notes: string;
  setStep: (step: number) => void;
  setMilestoneId: (id: string) => void;
  setGpsCoords: (coords: { latitude: number; longitude: number }) => void;
  setEvidenceFiles: (files: File[]) => void;
  setSignature: (sig: string) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
}

export const useAttestationStore = create<AttestationState>()((set) => ({
  currentStep: 0,
  milestoneId: null,
  gpsCoords: null,
  evidenceFiles: [],
  signature: null,
  notes: "",
  setStep: (currentStep) => set({ currentStep }),
  setMilestoneId: (milestoneId) => set({ milestoneId }),
  setGpsCoords: (gpsCoords) => set({ gpsCoords }),
  setEvidenceFiles: (evidenceFiles) => set({ evidenceFiles }),
  setSignature: (signature) => set({ signature }),
  setNotes: (notes) => set({ notes }),
  reset: () =>
    set({
      currentStep: 0,
      milestoneId: null,
      gpsCoords: null,
      evidenceFiles: [],
      signature: null,
      notes: "",
    }),
}));

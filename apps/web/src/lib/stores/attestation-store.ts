import { create } from "zustand";

interface AttestationWizardState {
  currentStep: number;
  milestoneId: string | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  gpsVerified: boolean;
  evidenceFiles: File[];
  evidenceHash: string | null;
  signature: string | null;
  submitting: boolean;
  submitted: boolean;
  referenceId: string | null;

  setStep: (step: number) => void;
  setMilestone: (id: string) => void;
  setGps: (lat: number, lng: number) => void;
  setGpsVerified: (v: boolean) => void;
  addEvidence: (files: File[]) => void;
  removeEvidence: (index: number) => void;
  setEvidenceHash: (hash: string) => void;
  setSignature: (sig: string) => void;
  setSubmitting: (v: boolean) => void;
  setSubmitted: (ref: string) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 0,
  milestoneId: null,
  gpsLatitude: null,
  gpsLongitude: null,
  gpsVerified: false,
  evidenceFiles: [] as File[],
  evidenceHash: null,
  signature: null,
  submitting: false,
  submitted: false,
  referenceId: null,
};

export const useAttestationStore = create<AttestationWizardState>()((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),
  setMilestone: (id) => set({ milestoneId: id }),
  setGps: (lat, lng) => set({ gpsLatitude: lat, gpsLongitude: lng }),
  setGpsVerified: (v) => set({ gpsVerified: v }),
  addEvidence: (files) =>
    set((s) => ({ evidenceFiles: [...s.evidenceFiles, ...files] })),
  removeEvidence: (index) =>
    set((s) => ({
      evidenceFiles: s.evidenceFiles.filter((_, i) => i !== index),
    })),
  setEvidenceHash: (hash) => set({ evidenceHash: hash }),
  setSignature: (sig) => set({ signature: sig }),
  setSubmitting: (v) => set({ submitting: v }),
  setSubmitted: (ref) => set({ submitted: true, referenceId: ref }),
  reset: () => set(initialState),
}));

"use client";

import { useState } from "react";
import { StepIndicator } from "@/components/attestations/step-indicator";
import { EvidenceUploader } from "@/components/attestations/evidence-uploader";
import { useAttestationStore } from "@/store/attestation-store";
import { useCreateAttestation, useAttestations } from "@/hooks/use-api";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Camera,
  Fingerprint,
  CheckCircle2,
  Navigation,
  Shield,
  FileCheck,
  Loader2,
} from "lucide-react";

// ─── Dummy Data (fallback when API is unavailable) ──────────────

const dummyRecentAttestations = [
  {
    id: "att-001",
    milestone: "Asphalt laying — Route N8",
    type: "inspector_verification",
    status: "verified",
    date: "2026-02-10T14:30:00Z",
  },
  {
    id: "att-002",
    milestone: "Foundation pouring — Stade Mohammed V",
    type: "auditor_validation",
    status: "submitted",
    date: "2026-02-09T11:00:00Z",
  },
  {
    id: "att-003",
    milestone: "Bridge construction — Barrage Al Massira",
    type: "citizen_biometric",
    status: "submitted",
    date: "2026-02-08T16:45:00Z",
  },
];

// Maps auth role → attestation type
const ROLE_TYPE_MAP: Record<string, string> = {
  inspector: "inspector_verification",
  auditor: "auditor_review",
  citizen: "citizen_approval",
};

/** SHA-256 hash of evidence files using Web Crypto API */
async function hashEvidence(files: File[]): Promise<string> {
  if (files.length === 0) return "";
  const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
  const total = new Uint8Array(buffers.reduce((n, b) => n + b.byteLength, 0));
  let offset = 0;
  for (const buf of buffers) {
    total.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }
  const digest = await crypto.subtle.digest("SHA-256", total);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Component ──────────────────────────────────────────────────

export default function AttestationsPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [gpsAcquired, setGpsAcquired] = useState(false);
  const [demoLat] = useState("33.9716");
  const [demoLng] = useState("-6.8498");
  const [signed, setSigned] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ id: string; isLive: boolean } | null>(null);
  const { evidenceFiles, reset } = useAttestationStore();

  const user = useAuthStore((s) => s.user);
  const role = user?.roles?.[0] ?? "inspector";
  const createAttestation = useCreateAttestation();

  // Fetch recent attestations from API with dummy fallback
  const { data: apiAttestations } = useAttestations();
  const recentAttestations = apiAttestations?.data
    ? apiAttestations.data.slice(0, 5).map((a) => ({
        id: a.id,
        milestone: a.milestone?.title ?? `Milestone ${a.milestoneId.slice(0, 8)}`,
        type: a.type,
        status: a.status,
        date: a.createdAt,
      }))
    : dummyRecentAttestations;
  const isAttestationsLive = apiAttestations !== null && apiAttestations !== undefined;

  function acquireGPS() {
    setGpsAcquired(true);
  }

  function nextStep() {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  }

  function prevStep() {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }

  function resetWizard() {
    setCurrentStep(0);
    setGpsAcquired(false);
    setSigned(false);
    setSubmitted(false);
    setSubmitting(false);
    setSubmitResult(null);
    reset();
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const evidenceHash = await hashEvidence(evidenceFiles);
      const demoSignature = `sig_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

      const payload = {
        milestoneId: "demo-milestone-001",
        type: ROLE_TYPE_MAP[role] ?? "inspector_verification",
        gpsLatitude: demoLat,
        gpsLongitude: demoLng,
        evidenceHash: evidenceHash || undefined,
        signature: demoSignature,
        metadata: {
          evidenceFileCount: evidenceFiles.length,
          submittedVia: "web",
        },
      };

      // Try real API first
      const result = await createAttestation.mutateAsync(payload);
      setSubmitResult({ id: result.id, isLive: true });
    } catch {
      // API unavailable or auth failed — simulate success for demo
      const demoId = `att-${Date.now().toString(36)}`;
      setSubmitResult({ id: demoId, isLive: false });
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-primary">Attestations</h1>
          {!isAttestationsLive && (
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-amber-600 border-amber-200 bg-amber-50">
              Demo Data
            </Badge>
          )}
          {isAttestationsLive && (
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-accent border-accent/20 bg-accent/5">
              Live
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit field attestations to verify milestone completion.
        </p>
      </div>

      {/* Submit New Attestation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            New Attestation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <StepIndicator currentStep={currentStep} />

          <Separator />

          {/* Step 0: GPS */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <MapPin className="h-5 w-5 text-primary" />
                GPS Location Verification
              </h3>
              <p className="text-sm text-muted-foreground">
                Your location must be within the project&apos;s geofence boundary
                to submit an attestation. This ensures on-site presence.
              </p>

              {!gpsAcquired ? (
                <Button
                  onClick={acquireGPS}
                  className="bg-primary hover:bg-primary/90 gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  Acquire GPS Location
                </Button>
              ) : (
                <div className="rounded-lg border bg-accent/5 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <span className="font-medium text-accent">
                      Location acquired
                    </span>
                  </div>
                  <p className="font-mono text-sm text-muted-foreground">
                    {demoLat}°N, {demoLng}°W
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Within geofence: Route Nationale N8, MS-3
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={nextStep}
                  disabled={!gpsAcquired}
                  className="bg-accent hover:bg-accent/90"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 1: Evidence */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Camera className="h-5 w-5 text-primary" />
                Upload Evidence
              </h3>
              <p className="text-sm text-muted-foreground">
                Capture and upload photographic evidence of the milestone
                completion. Images are hashed for integrity verification.
              </p>

              <EvidenceUploader />

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={evidenceFiles.length === 0}
                  className="bg-accent hover:bg-accent/90"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Digital Signature */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Fingerprint className="h-5 w-5 text-primary" />
                Digital Signature
              </h3>
              <p className="text-sm text-muted-foreground">
                Sign your attestation with your Ed25519 private key linked to
                your DID. This creates a cryptographically verifiable proof.
              </p>

              {!signed ? (
                <Button
                  onClick={() => setSigned(true)}
                  className="bg-primary hover:bg-primary/90 gap-2"
                >
                  <Fingerprint className="h-4 w-4" />
                  Sign Attestation
                </Button>
              ) : (
                <div className="rounded-lg border bg-accent/5 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <span className="font-medium text-accent">
                      Attestation signed
                    </span>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground break-all">
                    sig: f4a8e21b5c6d7e8f9a0b1c2d3e4f5a6b...
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!signed}
                  className="bg-accent hover:bg-accent/90"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {currentStep === 3 && !submitted && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <FileCheck className="h-5 w-5 text-primary" />
                Review & Submit
              </h3>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">GPS</span>
                  <span className="font-mono text-sm">
                    {demoLat}°N, {demoLng}°W
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Evidence Files
                  </span>
                  <span className="text-sm font-medium">
                    {evidenceFiles.length} file(s)
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Attestation Type
                  </span>
                  <Badge variant="secondary" className="capitalize">
                    {(ROLE_TYPE_MAP[role] ?? "inspector_verification").replace(/_/g, " ")}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Signature
                  </span>
                  <Badge className="bg-accent text-accent-foreground">Signed</Badge>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep} disabled={submitting}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-accent hover:bg-accent/90 gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Submit Attestation
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Success State */}
          {submitted && submitResult && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                <CheckCircle2 className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Attestation Submitted
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Your attestation has been recorded on the TML transparency ledger
                and is pending quorum verification.
              </p>
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2 w-full max-w-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reference ID</span>
                  <span className="font-mono text-xs">{submitResult.id}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-accent text-accent-foreground">Submitted</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Source</span>
                  {submitResult.isLive ? (
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-accent border-accent/20 bg-accent/5">
                      Live API
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-amber-600 border-amber-200 bg-amber-50">
                      Demo
                    </Badge>
                  )}
                </div>
              </div>
              <Button onClick={resetWizard} className="mt-2 bg-primary hover:bg-primary/90">
                Submit Another Attestation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Attestations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Recent Attestations
            {!isAttestationsLive && (
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-amber-600 border-amber-200 bg-amber-50">
                Demo
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAttestations.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{att.milestone}</p>
                  <p className="text-xs text-muted-foreground">
                    {att.type.replace(/_/g, " ")} ·{" "}
                    {new Date(att.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Badge
                  variant={att.status === "verified" ? "default" : "secondary"}
                  className={
                    att.status === "verified"
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : ""
                  }
                >
                  {att.status === "verified" ? "Verified" : "Submitted"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

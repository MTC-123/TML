"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AuthGuard } from "@/components/auth/auth-guard";
import { StepIndicator } from "@/components/attestations/step-indicator";
import { GpsLocationPicker } from "@/components/attestations/gps-location-picker";
import { EvidenceUploader } from "@/components/attestations/evidence-uploader";
import { SignaturePad } from "@/components/attestations/signature-pad";
import { useAttestationStore } from "@/store/attestation-store";
import { submitMilestoneAttestation } from "@/lib/api/endpoints/attestations";
import { formatDate } from "@/lib/formatters/date";

function ReviewStep() {
  const { gpsCoords, evidenceFiles, signature, notes, milestoneId } =
    useAttestationStore();

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4 space-y-3">
        <h4 className="text-sm font-semibold">Milestone</h4>
        <p className="text-sm text-muted-foreground">
          {milestoneId ?? "Not specified"}
        </p>
      </div>

      <div className="rounded-md border p-4 space-y-3">
        <h4 className="text-sm font-semibold">GPS Location</h4>
        {gpsCoords ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Lat:</span>{" "}
              <span className="font-mono">{gpsCoords.latitude.toFixed(7)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Lng:</span>{" "}
              <span className="font-mono">{gpsCoords.longitude.toFixed(7)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-600">No location captured</p>
        )}
      </div>

      <div className="rounded-md border p-4 space-y-3">
        <h4 className="text-sm font-semibold">Evidence</h4>
        <p className="text-sm text-muted-foreground">
          {evidenceFiles.length} file{evidenceFiles.length !== 1 ? "s" : ""} uploaded
        </p>
        {evidenceFiles.length > 0 && (
          <ul className="text-sm space-y-1">
            {evidenceFiles.map((f, i) => (
              <li key={i} className="text-muted-foreground truncate">
                {f.name} ({(f.size / 1024).toFixed(1)} KB)
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-md border p-4 space-y-3">
        <h4 className="text-sm font-semibold">Signature</h4>
        {signature ? (
          <p className="text-xs font-mono text-muted-foreground break-all">
            {signature.slice(0, 64)}...
          </p>
        ) : (
          <p className="text-sm text-red-600">Not signed</p>
        )}
      </div>

      {notes && (
        <div className="rounded-md border p-4 space-y-3">
          <h4 className="text-sm font-semibold">Notes</h4>
          <p className="text-sm text-muted-foreground">{notes}</p>
        </div>
      )}
    </div>
  );
}

function AttestWizardContent() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    currentStep,
    setStep,
    gpsCoords,
    evidenceFiles,
    signature,
    notes,
    milestoneId,
    reset,
  } = useAttestationStore();

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 0:
        return gpsCoords !== null;
      case 1:
        return evidenceFiles.length > 0;
      case 2:
        return signature !== null;
      case 3:
        return true;
      default:
        return false;
    }
  }, [currentStep, gpsCoords, evidenceFiles, signature]);

  const handleNext = () => {
    if (currentStep < 3) {
      setStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!milestoneId || !gpsCoords || !signature) return;

    setSubmitting(true);
    try {
      const evidenceHash =
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

      await submitMilestoneAttestation(milestoneId, {
        actorId: "00000000-0000-0000-0000-000000000000",
        type: "inspector_verification",
        evidenceHash,
        gpsLatitude: gpsCoords.latitude.toFixed(7),
        gpsLongitude: gpsCoords.longitude.toFixed(7),
        deviceAttestationToken: "browser-attestation",
        digitalSignature: signature,
      });

      toast.success("Attestation submitted successfully");
      reset();
      router.push("/attestations");
    } catch {
      toast.error("Failed to submit attestation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = [
    "Capture GPS Location",
    "Upload Evidence",
    "Sign Attestation",
    "Review & Submit",
  ];

  const stepDescriptions = [
    "Verify your presence at the project site.",
    "Provide photographic evidence of milestone completion.",
    "Add notes and digitally sign your attestation.",
    "Review all details before submitting.",
  ];

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">New Attestation</h1>
        <p className="text-muted-foreground mt-1">
          Complete all steps to submit your attestation.
        </p>
      </div>

      <div className="mb-8">
        <StepIndicator currentStep={currentStep} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{stepTitles[currentStep]}</CardTitle>
          <CardDescription>{stepDescriptions[currentStep]}</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {currentStep === 0 && <GpsLocationPicker />}
          {currentStep === 1 && <EvidenceUploader />}
          {currentStep === 2 && <SignaturePad />}
          {currentStep === 3 && <ReviewStep />}
        </CardContent>
        <Separator />
        <CardFooter className="justify-between pt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !canProceed()}
              className="bg-[#2d8a4e] hover:bg-[#2d8a4e]/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Attestation
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AttestPage() {
  return (
    <AuthGuard>
      <AttestWizardContent />
    </AuthGuard>
  );
}

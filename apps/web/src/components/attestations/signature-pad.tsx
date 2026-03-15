"use client";

import { PenLine, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAttestationStore } from "@/store/attestation-store";

function generateMockSignature(): string {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function SignaturePad() {
  const notes = useAttestationStore((s) => s.notes);
  const setNotes = useAttestationStore((s) => s.setNotes);
  const signature = useAttestationStore((s) => s.signature);
  const setSignature = useAttestationStore((s) => s.setSignature);

  const handleSign = () => {
    setSignature(generateMockSignature());
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Notes (optional)</label>
        <Textarea
          placeholder="Add any observations or notes about this attestation..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Digital Signature</label>
        <p className="text-sm text-muted-foreground">
          Signing confirms your identity and binds this attestation to your DID.
        </p>

        {signature ? (
          <div className="rounded-md bg-green-50 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#2d8a4e]" />
              <span className="text-sm font-medium text-[#2d8a4e]">
                Signed
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground break-all">
              {signature}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSign}
              className="mt-2"
            >
              Re-sign
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleSign}
            className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90"
          >
            <PenLine className="mr-2 h-4 w-4" />
            Sign Attestation
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, FileCheck, Hash, Fingerprint } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface CertificateViewerProps {
  id: string;
  hash: string;
  signature: string;
  status: "issued" | "revoked";
  issuedAt: string;
  milestoneId: string;
  milestoneTitle: string;
  projectTitle: string;
  tgrReference?: string;
  issuerDid?: string;
}

export function CertificateViewer({
  id,
  hash,
  signature,
  status,
  issuedAt,
  milestoneId,
  milestoneTitle,
  projectTitle,
  tgrReference,
  issuerDid,
}: CertificateViewerProps) {
  const dateStr = new Date(issuedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const verifyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/verify?hash=${hash}`
    : `https://tml.ma/verify?hash=${hash}`;

  return (
    <Card className="max-w-2xl mx-auto border-2">
      {/* Header */}
      <CardHeader className="bg-primary text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8" />
            <div>
              <CardTitle className="text-lg">
                Payment Clearance Certificate
              </CardTitle>
              <p className="text-sm text-white/80 mt-0.5">
                TML — Transparency Middleware Layer
              </p>
            </div>
          </div>
          <Badge
            variant={status === "issued" ? "default" : "destructive"}
            className={
              status === "issued"
                ? "bg-accent text-white hover:bg-accent/90 text-base px-4 py-1"
                : "text-base px-4 py-1"
            }
          >
            {status === "issued" ? "Issued" : "Revoked"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Project & Milestone */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileCheck className="h-4 w-4" />
            <span>Project: <strong className="text-foreground">{projectTitle}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileCheck className="h-4 w-4" />
            <span>Milestone: <strong className="text-foreground">{milestoneTitle}</strong></span>
          </div>
          <p className="text-sm text-muted-foreground">
            Issued: <strong className="text-foreground">{dateStr}</strong>
          </p>
        </div>

        <Separator />

        {/* Certificate Hash */}
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Hash className="h-4 w-4" />
            Certificate Hash (SHA-256)
          </h3>
          <code className="block break-all rounded bg-muted p-3 text-xs font-mono">
            {hash}
          </code>
        </div>

        {/* Signature */}
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Fingerprint className="h-4 w-4" />
            Ed25519 Signature
          </h3>
          <code className="block break-all rounded bg-muted p-3 text-xs font-mono">
            {signature}
          </code>
        </div>

        {/* TGR Reference */}
        {tgrReference && (
          <>
            <Separator />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">TGR Reference</h3>
              <p className="text-sm font-mono">{tgrReference}</p>
            </div>
          </>
        )}

        {/* Issuer DID */}
        {issuerDid && (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Issuer DID</h3>
            <p className="text-sm font-mono break-all">{issuerDid}</p>
          </div>
        )}

        <Separator />

        {/* QR Code */}
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-sm font-semibold">QR Code</h3>
          <div className="rounded-lg border p-4 bg-white">
            <QRCodeSVG value={verifyUrl} size={160} level="H" />
          </div>
          <p className="text-xs text-muted-foreground">
            Scan to verify this certificate
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

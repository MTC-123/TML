"use client";

import { FileCheck, Shield, Hash, Calendar, Building2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QRCodeDisplay } from "@/components/certificates/qr-code-display";
import { getCertificateStatusDisplay } from "@/lib/formatters/status";
import { formatDateTime } from "@/lib/formatters/date";
import type { CertificateStatus } from "@tml/types";

interface CertificateViewerProps {
  id: string;
  hash: string;
  signature: string;
  status: CertificateStatus;
  issuedAt: string;
  tgrReference?: string;
  milestoneId: string;
  milestoneTitle?: string;
  projectTitle?: string;
  issuerDid?: string;
}

export function CertificateViewer({
  hash,
  signature,
  status,
  issuedAt,
  tgrReference,
  milestoneTitle,
  projectTitle,
  issuerDid,
}: CertificateViewerProps) {
  const statusDisplay = getCertificateStatusDisplay(status);
  const [copied, setCopied] = useState<string | null>(null);

  function copyToClipboard(value: string, key: string) {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2d8a4e]/10">
            <FileCheck className="h-5 w-5 text-[#2d8a4e]" />
          </div>
          <div>
            <CardTitle>Payment Clearance Certificate</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {projectTitle && `${projectTitle} — `}{milestoneTitle}
            </p>
          </div>
        </div>
        <Badge variant={statusDisplay.variant} className="text-sm">
          {statusDisplay.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Certificate Hash */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Hash className="h-4 w-4" />
            Certificate Hash (SHA-256)
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted p-3 text-xs font-mono break-all">
              {hash}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(hash, "hash")}
            >
              {copied === "hash" ? (
                <Check className="h-4 w-4 text-[#2d8a4e]" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Ed25519 Signature */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Shield className="h-4 w-4" />
            Ed25519 Signature
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted p-3 text-xs font-mono break-all">
              {signature}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(signature, "sig")}
            >
              {copied === "sig" ? (
                <Check className="h-4 w-4 text-[#2d8a4e]" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Issuance Date
            </div>
            <p className="text-sm">{formatDateTime(issuedAt)}</p>
          </div>

          {tgrReference && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                TGR Reference
              </div>
              <p className="text-sm font-mono">{tgrReference}</p>
            </div>
          )}

          {issuerDid && (
            <div className="space-y-1 md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Issuer DID</p>
              <code className="text-xs font-mono break-all">{issuerDid}</code>
            </div>
          )}
        </div>

        {/* QR Code */}
        <Separator />
        <div className="flex justify-center py-4">
          <QRCodeDisplay value={hash} size={160} />
        </div>
      </CardContent>
    </Card>
  );
}

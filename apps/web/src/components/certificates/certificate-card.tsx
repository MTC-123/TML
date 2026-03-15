"use client";

import Link from "next/link";
import { FileCheck, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCertificateStatusDisplay } from "@/lib/formatters/status";
import { formatDateShort } from "@/lib/formatters/date";
import type { CertificateStatus } from "@tml/types";

interface CertificateCardProps {
  id: string;
  hash: string;
  status: CertificateStatus;
  issuedAt: string;
  milestoneTitle?: string;
}

export function CertificateCard({
  id,
  hash,
  status,
  issuedAt,
  milestoneTitle,
}: CertificateCardProps) {
  const statusDisplay = getCertificateStatusDisplay(status);
  const truncatedHash = `${hash.slice(0, 8)}...${hash.slice(-8)}`;

  return (
    <Link href={`certificates/${id}`}>
      <Card className="hover:border-[#1e3a5f]/30 transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-[#2d8a4e]" />
            <CardTitle className="text-sm font-mono">{truncatedHash}</CardTitle>
          </div>
          <Badge variant={statusDisplay.variant}>{statusDisplay.label}</Badge>
        </CardHeader>
        <CardContent>
          {milestoneTitle && (
            <p className="text-sm text-muted-foreground mb-1">{milestoneTitle}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Issued {formatDateShort(issuedAt)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

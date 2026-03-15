"use client";

import Link from "next/link";
import { MapPin, Calendar, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AttestationStatusBadge } from "./attestation-status-badge";
import { formatDate } from "@/lib/formatters/date";
import type { AttestationStatus, AttestationType } from "@tml/types";

const typeLabels: Record<AttestationType, string> = {
  inspector_verification: "Inspector Verification",
  auditor_review: "Auditor Review",
  citizen_approval: "Citizen Approval",
};

interface AttestationCardProps {
  id: string;
  type: AttestationType;
  status: AttestationStatus;
  milestoneId: string;
  submittedAt: Date | string;
  gpsLatitude: string;
  gpsLongitude: string;
  locale?: string;
}

export function AttestationCard({
  id,
  type,
  status,
  milestoneId,
  submittedAt,
  gpsLatitude,
  gpsLongitude,
  locale = "en",
}: AttestationCardProps) {
  return (
    <Link href={`/${locale}/attestations/${id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <CardTitle className="text-base font-semibold">
            {typeLabels[type]}
          </CardTitle>
          <AttestationStatusBadge status={status} />
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            <span className="truncate">Milestone: {milestoneId.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            <span>
              {gpsLatitude}, {gpsLongitude}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(submittedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

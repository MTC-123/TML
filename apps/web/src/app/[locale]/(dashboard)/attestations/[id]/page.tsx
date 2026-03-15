"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  FileText,
  ShieldCheck,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AttestationStatusBadge } from "@/components/attestations/attestation-status-badge";
import { AuthGuard } from "@/components/auth/auth-guard";
import { formatDateTime } from "@/lib/formatters/date";
import { getAttestation } from "@/lib/api/endpoints/attestations";
import type { AttestationType } from "@tml/types";

const typeLabels: Record<AttestationType, string> = {
  inspector_verification: "Inspector Verification",
  auditor_review: "Auditor Review",
  citizen_approval: "Citizen Approval",
};

function AttestationDetailContent() {
  const params = useParams();
  const locale = (params?.['locale'] as string) ?? "en";
  const id = params?.['id'] as string;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["attestations", id],
    queryFn: () => getAttestation(id),
    enabled: !!id,
  });

  const attestation = data?.data;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl py-8 px-4 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-[150px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-3xl py-8 px-4 text-center">
        <p className="text-destructive">Failed to load attestation</p>
        <Button variant="outline" className="mt-2" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!attestation) {
    return (
      <div className="container mx-auto max-w-3xl py-8 px-4 text-center">
        <p className="text-muted-foreground">Attestation not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <div className="mb-6">
        <Link href={`/${locale}/attestations`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Attestations
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">
              Attestation Detail
            </h1>
            <p className="text-sm font-mono text-muted-foreground mt-1">
              {attestation.id}
            </p>
          </div>
          <AttestationStatusBadge status={attestation.status} />
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-[#1e3a5f]" />
              General Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="text-sm font-medium">
                  {typeLabels[attestation.type as AttestationType] ?? attestation.type}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <AttestationStatusBadge status={attestation.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Submitted
                </p>
                <p className="text-sm font-medium">
                  {formatDateTime(attestation.submittedAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Actor DID</p>
                <p className="text-sm font-mono">
                  {attestation.actorId?.slice(0, 20) ?? "---"}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(attestation.gpsLatitude || attestation.gpsLongitude) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-[#1e3a5f]" />
                GPS Coordinates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Latitude</p>
                  <p className="text-sm font-mono font-medium">
                    {attestation.gpsLatitude ?? "---"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Longitude</p>
                  <p className="text-sm font-mono font-medium">
                    {attestation.gpsLongitude ?? "---"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {attestation.evidenceHash && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="h-5 w-5 text-[#1e3a5f]" />
                Evidence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Evidence Hash (SHA-256)</p>
                <p className="text-xs font-mono break-all mt-1">
                  {attestation.evidenceHash}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {attestation.digitalSignature && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-[#1e3a5f]" />
                Digital Signature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-1">
                Ed25519 Signature
              </p>
              <p className="text-xs font-mono break-all">
                {attestation.digitalSignature}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LinkIcon className="h-5 w-5 text-[#1e3a5f]" />
              Linked Milestone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Milestone ID</p>
                <p className="text-sm font-mono">{attestation.milestoneId}</p>
              </div>
              <Link href={`/${locale}/projects`}>
                <Button variant="outline" size="sm">
                  View Milestone
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AttestationDetailPage() {
  return (
    <AuthGuard>
      <AttestationDetailContent />
    </AuthGuard>
  );
}

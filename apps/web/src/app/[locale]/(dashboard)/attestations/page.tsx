"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, Eye, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AttestationStatusBadge } from "@/components/attestations/attestation-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AuthGuard } from "@/components/auth/auth-guard";
import { formatDate } from "@/lib/formatters/date";
import { listAttestations } from "@/lib/api/endpoints/attestations";
import type { AttestationType } from "@tml/types";

const typeLabels: Record<AttestationType, string> = {
  inspector_verification: "Inspector Verification",
  auditor_review: "Auditor Review",
  citizen_approval: "Citizen Approval",
};

function AttestationsContent() {
  const params = useParams();
  const locale = (params?.['locale'] as string) ?? "en";

  // Note: listAttestations requires milestoneId; for a general list we pass a
  // broad query. If the API supports listing all attestations, this will work.
  // Otherwise the backend may need a /api/v1/attestations endpoint without milestoneId.
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["attestations"],
    queryFn: () => listAttestations({ milestoneId: "", limit: 50 }),
  });

  const attestations = data?.data ?? [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Attestations</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all attestation submissions.
          </p>
        </div>
        <Link href={`/${locale}/attest`}>
          <Button className="bg-[#2d8a4e] hover:bg-[#2d8a4e]/90">
            <Plus className="mr-2 h-4 w-4" />
            New Attestation
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>All Attestations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load attestations</p>
          <Button variant="outline" className="mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : attestations.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No attestations found"
          description="No attestation submissions yet."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Attestations</CardTitle>
            <CardDescription>
              {attestations.length} attestation
              {attestations.length !== 1 ? "s" : ""} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attestations.map((attestation) => (
                  <TableRow key={attestation.id}>
                    <TableCell className="font-medium">
                      {typeLabels[attestation.type as AttestationType] ?? attestation.type}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {attestation.milestoneId.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <AttestationStatusBadge status={attestation.status} />
                    </TableCell>
                    <TableCell>{formatDate(attestation.submittedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/${locale}/attestations/${attestation.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AttestationsPage() {
  return (
    <AuthGuard>
      <AttestationsContent />
    </AuthGuard>
  );
}

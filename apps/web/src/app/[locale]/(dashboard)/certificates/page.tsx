"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileCheck, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { getCertificateStatusDisplay } from "@/lib/formatters/status";
import { formatDateShort } from "@/lib/formatters/date";
import { listCertificates } from "@/lib/api/endpoints/certificates";
import type { CertificateStatus } from "@tml/types";
import Link from "next/link";

const statusOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "issued", label: "Issued" },
  { value: "delivered_to_tgr", label: "Delivered to TGR" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "revoked", label: "Revoked" },
];

export default function CertificatesPage() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["certificates", statusFilter],
    queryFn: () =>
      listCertificates({
        status:
          statusFilter === "all"
            ? undefined
            : (statusFilter as CertificateStatus),
      }),
  });

  const certificates = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Certificates</h1>
          <p className="text-muted-foreground">
            Payment Clearance Certificates for completed milestones
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load certificates</p>
          <Button variant="outline" className="mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : certificates.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No certificates found"
          description="No certificates match the selected filter."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hash</TableHead>
                <TableHead>Milestone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>TGR Ref.</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.map((cert) => {
                const display = getCertificateStatusDisplay(cert.status);
                return (
                  <TableRow key={cert.id}>
                    <TableCell className="font-mono text-xs">
                      {cert.certificateHash.slice(0, 12)}...
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate">
                      {cert.milestoneId}
                    </TableCell>
                    <TableCell>
                      <Badge variant={display.variant}>{display.label}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {cert.tgrReference ?? "---"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateShort(cert.issuedAt)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`certificates/${cert.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

"use client";

import { CertificateCard } from "@/components/certificates/certificate-card";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCertificates } from "@/hooks/use-api";

const dummyCertificates = [
  {
    id: "cert-001",
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    status: "issued" as const,
    issuedAt: "2025-12-22T16:00:00Z",
    milestoneTitle: "Land acquisition and EIA — Route N8",
  },
  {
    id: "cert-002",
    hash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    status: "issued" as const,
    issuedAt: "2026-03-18T10:00:00Z",
    milestoneTitle: "Foundation pouring — Route N8",
  },
  {
    id: "cert-003",
    hash: "deadbeef0123456789abcdef0123456789abcdef0123456789abcdef01234567",
    status: "revoked" as const,
    issuedAt: "2026-01-15T10:00:00Z",
    milestoneTitle: "Structural assessment — Stade Mohammed V",
  },
  {
    id: "cert-004",
    hash: "cafe0101cafe0101cafe0101cafe0101cafe0101cafe0101cafe0101cafe0101",
    status: "issued" as const,
    issuedAt: "2026-02-28T14:00:00Z",
    milestoneTitle: "Bridge foundation — Barrage Al Massira",
  },
];

export default function CertificatesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: apiData, isLoading } = useCertificates({ status: statusFilter });

  // Map API data to card-friendly shape, or fall back to dummy
  const certificates = apiData?.data
    ? apiData.data.map((c) => ({
        id: c.id,
        hash: c.hash,
        status: c.status as "issued" | "revoked",
        issuedAt: c.issuedAt,
        milestoneTitle: c.milestone?.title ?? "Unknown milestone",
      }))
    : dummyCertificates;

  const isLive = apiData !== null && apiData !== undefined;

  const filtered = certificates.filter((c) => {
    const matchesSearch =
      !search ||
      c.hash.includes(search.toLowerCase()) ||
      c.milestoneTitle?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-primary">Certificates</h1>
          {!isLive && (
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-amber-600 border-amber-200 bg-amber-50">
              Demo Data
            </Badge>
          )}
          {isLive && (
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-accent border-accent/20 bg-accent/5">
              Live
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Payment Clearance Certificates issued by the TML transparency layer.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          onChange={setSearch}
          placeholder="Search by hash or milestone..."
          className="sm:max-w-sm"
        />
        <div className="flex gap-2">
          {[
            { key: "all", label: "All" },
            { key: "issued", label: "Issued" },
            { key: "revoked", label: "Revoked" },
          ].map((f) => (
            <Badge
              key={f.key}
              variant={statusFilter === f.key ? "default" : "outline"}
              className={`cursor-pointer ${statusFilter === f.key ? "bg-primary text-white" : ""}`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </Badge>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && filtered.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No certificates found"
          description="Try adjusting your search or filter criteria."
        />
      ) : !isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cert) => (
            <CertificateCard key={cert.id} {...cert} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

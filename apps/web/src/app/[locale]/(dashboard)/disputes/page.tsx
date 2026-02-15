"use client";

import { useState } from "react";
import { DisputeCard } from "@/components/disputes/dispute-card";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useDisputes } from "@/hooks/use-api";

interface DisputeDisplay {
  id: string;
  reason: string;
  status: "open" | "under_review" | "resolved" | "dismissed";
  createdAt: string;
  milestoneTitle: string;
  filedBy: string;
}

const dummyDisputes: DisputeDisplay[] = [
  {
    id: "disp-001",
    reason:
      "Concrete quality does not meet Grade C35 specification — core samples show compressive strength at 28 MPa vs required 35 MPa",
    status: "open",
    createdAt: "2026-02-10T09:00:00Z",
    milestoneTitle: "Asphalt laying — Route N8",
    filedBy: "Inspector Alami",
  },
  {
    id: "disp-002",
    reason:
      "Steel reinforcement bars do not match approved structural drawings — 12mm used instead of specified 16mm",
    status: "under_review",
    createdAt: "2026-01-28T14:00:00Z",
    milestoneTitle: "Bridge construction — Barrage Al Massira",
    filedBy: "Auditor Benani",
  },
  {
    id: "disp-003",
    reason:
      "Geofence mismatch detected — attestation GPS coordinates are 2.3km outside the project boundary",
    status: "resolved",
    createdAt: "2025-12-15T11:30:00Z",
    milestoneTitle: "Foundation pouring — Stade Mohammed V",
    filedBy: "System (Auto-detection)",
  },
  {
    id: "disp-004",
    reason:
      "Citizen attestation submitted without valid CNIE binding — device attestation token expired",
    status: "dismissed",
    createdAt: "2025-11-20T08:00:00Z",
    milestoneTitle: "Land acquisition — Route N8",
    filedBy: "System (Validation)",
  },
];

const statusFilters = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "under_review", label: "Under Review" },
  { key: "resolved", label: "Resolved" },
  { key: "dismissed", label: "Dismissed" },
];

export default function DisputesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: apiData, isLoading } = useDisputes({ status: statusFilter });

  const disputes: DisputeDisplay[] = apiData?.data
    ? apiData.data.map((d) => ({
        id: d.id,
        reason: d.reason,
        status: d.status as DisputeDisplay["status"],
        createdAt: d.createdAt,
        milestoneTitle: d.milestone?.title ?? "Unknown milestone",
        filedBy: d.raisedBy?.did ?? "Unknown",
      }))
    : dummyDisputes;

  const isLive = apiData !== null && apiData !== undefined;

  const filtered = disputes.filter((d) => {
    const matchesSearch =
      !search ||
      d.reason.toLowerCase().includes(search.toLowerCase()) ||
      d.milestoneTitle?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Summary stats
  const open = disputes.filter((d) => d.status === "open").length;
  const underReview = disputes.filter((d) => d.status === "under_review").length;
  const resolved = disputes.filter((d) => d.status === "resolved").length;
  const dismissed = disputes.filter((d) => d.status === "dismissed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-primary">Disputes</h1>
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
          Track and resolve quality disputes across all projects.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{open}</p>
              <p className="text-xs text-muted-foreground">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Clock className="h-5 w-5 text-warning" />
            <div>
              <p className="text-2xl font-bold">{underReview}</p>
              <p className="text-xs text-muted-foreground">Under Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            <div>
              <p className="text-2xl font-bold">{resolved}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <XCircle className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{dismissed}</p>
              <p className="text-xs text-muted-foreground">Dismissed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          onChange={setSearch}
          placeholder="Search disputes..."
          className="sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((sf) => (
            <Badge
              key={sf.key}
              variant={statusFilter === sf.key ? "default" : "outline"}
              className={`cursor-pointer transition-colors ${
                statusFilter === sf.key
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "hover:bg-muted"
              }`}
              onClick={() => setStatusFilter(sf.key)}
            >
              {sf.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* List */}
      {!isLoading && filtered.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No disputes found"
          description="Try adjusting your search or filter criteria."
        />
      ) : !isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((d) => (
            <DisputeCard key={d.id} {...d} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

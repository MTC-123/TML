"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Filter, Plus } from "lucide-react";
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
import { getDisputeStatusDisplay } from "@/lib/formatters/status";
import { formatDateShort } from "@/lib/formatters/date";
import { listDisputes } from "@/lib/api/endpoints/disputes";
import Link from "next/link";

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "under_review", label: "Under Review" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

export default function DisputesPage() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["disputes", statusFilter],
    queryFn: () =>
      listDisputes({
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  const disputes = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Disputes</h1>
          <p className="text-muted-foreground">
            Track and manage milestone disputes
          </p>
        </div>
        <Button asChild className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
          <Link href="disputes/new">
            <Plus className="mr-2 h-4 w-4" />
            File Dispute
          </Link>
        </Button>
      </div>

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

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load disputes</p>
          <Button variant="outline" className="mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : disputes.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No disputes found"
          description="No disputes match the selected filter."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reason</TableHead>
                <TableHead>Milestone</TableHead>
                <TableHead>Filed By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((dispute) => {
                const display = getDisputeStatusDisplay(dispute.status);
                return (
                  <TableRow key={dispute.id}>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {dispute.reason}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {dispute.milestoneId}
                    </TableCell>
                    <TableCell>{dispute.raisedById?.slice(0, 16) ?? "---"}...</TableCell>
                    <TableCell>
                      <Badge variant={display.variant}>{display.label}</Badge>
                    </TableCell>
                    <TableCell>{formatDateShort(dispute.raisedAt)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`disputes/${dispute.id}`}>View</Link>
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

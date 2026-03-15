"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Filter } from "lucide-react";
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
import { getAuditorAssignmentStatusDisplay } from "@/lib/formatters/status";
import { formatDateShort } from "@/lib/formatters/date";
import { listAuditorAssignments } from "@/lib/api/endpoints/auditors";
import type { AuditorAssignmentStatus } from "@tml/types";

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "assigned", label: "Assigned" },
  { value: "accepted", label: "Accepted" },
  { value: "completed", label: "Completed" },
  { value: "recused", label: "Recused" },
  { value: "replaced", label: "Replaced" },
];

export default function AuditorAssignmentsPage() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["auditor", "assignments", statusFilter],
    queryFn: () =>
      listAuditorAssignments({
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  const assignments = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Assignments</h1>
        <p className="text-muted-foreground">
          All your auditor assignments and review history
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
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
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load assignments</p>
          <Button variant="outline" className="mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No assignments found"
          description="No assignments match the selected filter."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Milestone</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="w-[150px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => {
                const display = getAuditorAssignmentStatusDisplay(a.status as AuditorAssignmentStatus);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.milestoneId?.slice(0, 12) ?? "---"}...
                    </TableCell>
                    <TableCell>{a.milestoneId?.slice(0, 8) ?? "---"}...</TableCell>
                    <TableCell>
                      <Badge variant={display.variant}>{display.label}</Badge>
                    </TableCell>
                    <TableCell>{a.assignedAt ? formatDateShort(a.assignedAt) : "---"}</TableCell>
                    <TableCell>
                      {a.status === "assigned" && (
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-[#2d8a4e] hover:bg-[#2d8a4e]/90">
                            Accept
                          </Button>
                          <Button size="sm" variant="outline">
                            Recuse
                          </Button>
                        </div>
                      )}
                      {a.status === "accepted" && (
                        <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
                          Submit Review
                        </Button>
                      )}
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

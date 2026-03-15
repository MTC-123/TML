"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Filter } from "lucide-react";
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
import { getMilestoneStatusDisplay } from "@/lib/formatters/status";
import { formatMAD } from "@/lib/formatters/currency";
import { formatDateShort } from "@/lib/formatters/date";
import { listProjects } from "@/lib/api/endpoints/projects";
import { listMilestones } from "@/lib/api/endpoints/milestones";
import type { MilestoneStatus } from "@tml/types";

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "attestation_in_progress", label: "Attestation In Progress" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export default function ContractorMilestonesPage() {
  const [statusFilter, setStatusFilter] = useState("all");

  // First, get the contractor's projects
  const { data: projectsData } = useQuery({
    queryKey: ["contractor", "projects-for-milestones"],
    queryFn: () => listProjects({ limit: 50 }),
  });

  const projects = projectsData?.data ?? [];
  const firstProjectId = projects[0]?.id;

  // Then list milestones for the first project (in a real app, we'd aggregate across all projects)
  const { data: milestonesData, isLoading, error, refetch } = useQuery({
    queryKey: ["contractor", "milestones", firstProjectId],
    queryFn: () => listMilestones(firstProjectId!, { limit: 50 }),
    enabled: !!firstProjectId,
  });

  const milestones = milestonesData?.data ?? [];

  const filtered =
    statusFilter === "all"
      ? milestones
      : milestones.filter((m) => m.status === statusFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Milestones</h1>
        <p className="text-muted-foreground">
          Track all your milestones across projects
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[220px]">
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
          <p className="text-destructive">Failed to load milestones</p>
          <Button variant="outline" className="mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No milestones found"
          description="No milestones match the selected filter."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Milestone</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="w-[120px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ms) => {
                const display = getMilestoneStatusDisplay(ms.status);
                return (
                  <TableRow key={ms.id}>
                    <TableCell className="font-medium">{ms.description ?? ms.id}</TableCell>
                    <TableCell>{ms.projectId?.slice(0, 8) ?? "---"}...</TableCell>
                    <TableCell>---</TableCell>
                    <TableCell>
                      <Badge variant={display.variant}>{display.label}</Badge>
                    </TableCell>
                    <TableCell>{formatDateShort(ms.createdAt)}</TableCell>
                    <TableCell>
                      {ms.status === "in_progress" && (
                        <Button size="sm" className="bg-[#2d8a4e] hover:bg-[#2d8a4e]/90">
                          Mark Complete
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

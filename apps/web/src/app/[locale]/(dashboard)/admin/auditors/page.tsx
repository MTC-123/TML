"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, UserPlus } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AuthGuard } from "@/components/auth/auth-guard";
import { EmptyState } from "@/components/shared/empty-state";
import { getAuditorAssignmentStatusDisplay } from "@/lib/formatters/status";
import { formatDateShort } from "@/lib/formatters/date";
import { listAuditorAssignments } from "@/lib/api/endpoints/auditors";
import type { AuditorAssignmentStatus } from "@tml/types";

export default function AdminAuditorsPage() {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "auditor-assignments"],
    queryFn: () => listAuditorAssignments(),
  });

  const assignments = data?.data ?? [];
  const total = data?.meta?.total ?? assignments.length;

  const activeCount = assignments.filter((a) => a.status === "accepted" || a.status === "assigned").length;
  const pendingCount = assignments.filter((a) => a.status === "assigned").length;
  const recusedCount = assignments.filter((a) => a.status === "recused").length;

  return (
    <AuthGuard requiredRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Auditor Management</h1>
            <p className="text-muted-foreground">
              Manage auditor assignments and pool selection
            </p>
          </div>
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Auditors
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Auditors for Milestone</DialogTitle>
                <DialogDescription>
                  Randomly select auditors from the eligible pool for a milestone review.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="assign-milestone-id" className="text-sm font-medium">Milestone ID</label>
                  <Input id="assign-milestone-id" placeholder="Enter milestone ID..." />
                </div>
                <div className="space-y-2">
                  <label htmlFor="assign-auditor-count" className="text-sm font-medium">Number of Auditors</label>
                  <Input id="assign-auditor-count" type="number" defaultValue={3} min={1} max={10} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90"
                  onClick={() => setAssignDialogOpen(false)}
                >
                  Select Auditors
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[80px] rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-sm text-muted-foreground">Total Assignments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-[#2d8a4e]">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-[#d97706]">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{recusedCount}</p>
                <p className="text-sm text-muted-foreground">Recused</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Assignments table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load auditor assignments</p>
            <Button variant="outline" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : assignments.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No assignments"
            description="No auditor assignments have been made yet."
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Auditor</TableHead>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => {
                  const display = getAuditorAssignmentStatusDisplay(a.status as AuditorAssignmentStatus);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div>
                          <p className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                            {a.auditorId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{a.milestoneId?.slice(0, 12) ?? "---"}...</TableCell>
                      <TableCell>
                        <Badge variant={display.variant}>{display.label}</Badge>
                      </TableCell>
                      <TableCell>{a.assignedAt ? formatDateShort(a.assignedAt) : "---"}</TableCell>
                      <TableCell>
                        {a.status === "recused" && (
                          <Button variant="outline" size="sm">
                            Reassign
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
    </AuthGuard>
  );
}

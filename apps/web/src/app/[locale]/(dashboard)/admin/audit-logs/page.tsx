"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Filter } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthGuard } from "@/components/auth/auth-guard";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/formatters/date";
import { listAuditLogs } from "@/lib/api/endpoints/audit-logs";
import type { AuditLogQuery } from "@tml/types";

const entityTypes = [
  { value: "all", label: "All Entities" },
  { value: "project", label: "Project" },
  { value: "milestone", label: "Milestone" },
  { value: "attestation", label: "Attestation" },
  { value: "certificate", label: "Certificate" },
  { value: "dispute", label: "Dispute" },
  { value: "user", label: "User" },
];

const actions = [
  { value: "all", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "attest", label: "Attest" },
  { value: "revoke", label: "Revoke" },
];

const actionColors: Record<string, string> = {
  create: "bg-[#2d8a4e] text-white",
  update: "bg-[#1e3a5f] text-white",
  delete: "bg-[#dc2626] text-white",
  attest: "bg-[#2d8a4e] text-white",
  revoke: "bg-[#d97706] text-white",
};

export default function AdminAuditLogsPage() {
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "audit-logs", entityFilter, actionFilter, dateFrom, dateTo],
    queryFn: () =>
      listAuditLogs({
        page: 1,
        limit: 50,
        entityType: entityFilter === "all" ? undefined : entityFilter,
        action: actionFilter === "all" ? undefined : actionFilter as AuditLogQuery["action"],
        from: dateFrom ? new Date(dateFrom) : undefined,
        to: dateTo ? new Date(dateTo) : undefined,
      }),
  });

  const logs = data?.data ?? [];

  return (
    <AuthGuard requiredRoles={["admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            System activity and audit trail
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[170px]" aria-label="Filter by entity type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {entityTypes.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[160px]" aria-label="Filter by action">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {actions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[160px]"
            aria-label="From date"
            placeholder="From"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[160px]"
            aria-label="To date"
            placeholder="To"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load audit logs</p>
            <Button variant="outline" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No logs found"
            description="No audit logs match the selected filters."
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">
                          {log.actorDid}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${actionColors[log.action] ?? "bg-secondary text-secondary-foreground"}`}
                      >
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {log.entityType}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                          {log.entityId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-[250px] truncate">
                      {typeof log.metadata === "object"
                        ? JSON.stringify(log.metadata ?? "")
                        : String(log.metadata ?? "")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

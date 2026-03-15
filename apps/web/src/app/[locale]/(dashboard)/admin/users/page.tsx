"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthGuard } from "@/components/auth/auth-guard";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDateShort } from "@/lib/formatters/date";
import { listAuditLogs } from "@/lib/api/endpoints/audit-logs";
import type { ActorRole } from "@tml/types";

// Note: There's no dedicated users endpoint yet. In a real app, you'd create
// an endpoint like listUsers(). For now, we show a placeholder that calls the
// audit-logs endpoint to demonstrate the pattern. When a users endpoint is added,
// swap `listAuditLogs` for `listUsers`.

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Placeholder: in production, replace with a real users endpoint
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => listAuditLogs({ page: 1, limit: 50 }),
  });

  // Since we don't have a users endpoint, we'll show an empty state for now
  // Replace this section when a users API endpoint is available

  return (
    <AuthGuard requiredRoles={["admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users and their roles
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            placeholder="Search by name or email..."
            onChange={setSearch}
            className="sm:w-[300px]"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
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
            <p className="text-destructive">Failed to load users</p>
            <Button variant="outline" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="User management"
            description="A dedicated users API endpoint is needed to populate this page. Connect it when the endpoint is available."
          />
        )}
      </div>
    </AuthGuard>
  );
}

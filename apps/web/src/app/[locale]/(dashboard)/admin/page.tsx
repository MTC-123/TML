"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Shield, FileText, Webhook } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/auth/auth-guard";
import { getAdminStats } from "@/lib/api/endpoints/dashboard";
import { listWebhooks } from "@/lib/api/endpoints/webhooks";
import { listAuditLogs } from "@/lib/api/endpoints/audit-logs";
import Link from "next/link";

export default function AdminPage() {
  const { data: statsData, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => getAdminStats(),
  });

  const { data: webhooksData } = useQuery({
    queryKey: ["admin", "webhooks-count"],
    queryFn: () => listWebhooks({ limit: 1 }),
  });

  const { data: auditLogsData } = useQuery({
    queryKey: ["admin", "audit-logs-count"],
    queryFn: () => listAuditLogs({ page: 1, limit: 1 }),
  });

  const stats = statsData?.data;
  const webhooksCount = webhooksData?.meta?.total ?? 0;
  const auditLogsCount = auditLogsData?.meta?.total ?? 0;

  const adminLinks = [
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      href: "admin/users",
      count: stats?.totalUsers ?? 0,
    },
    {
      title: "Auditor Management",
      description: "Assign and manage auditors",
      icon: Shield,
      href: "admin/auditors",
      count: 0,
    },
    {
      title: "Audit Logs",
      description: "View system activity and audit trail",
      icon: FileText,
      href: "admin/audit-logs",
      count: auditLogsCount,
    },
    {
      title: "Webhooks",
      description: "Configure webhook subscriptions",
      icon: Webhook,
      href: "admin/webhooks",
      count: webhooksCount,
    },
  ];

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0 },
    { label: "Active Projects", value: stats?.activeProjects ?? 0 },
    { label: "Certificates Issued", value: stats?.certificatesIssued ?? 0 },
    { label: "Open Disputes", value: stats?.openDisputes ?? 0 },
  ];

  return (
    <AuthGuard requiredRoles={["admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Administration</h1>
          <p className="text-muted-foreground">
            System overview and management
          </p>
        </div>

        {/* Quick stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[80px] rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load admin stats</p>
            <Button variant="outline" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Admin sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Card className="hover:border-[#1e3a5f]/30 transition-colors cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e3a5f]/10">
                      <Icon className="h-5 w-5 text-[#1e3a5f]" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{link.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {link.count.toLocaleString()}
                    </span>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AuthGuard>
  );
}

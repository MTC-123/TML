"use client";

import { useQuery } from "@tanstack/react-query";
import {
  FolderKanban,
  ClipboardCheck,
  Award,
  AlertTriangle,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { ProjectsTable } from "@/components/dashboard/projects-table";
import { AttestationPipeline } from "@/components/dashboard/attestation-pipeline";
import { DashboardTourTrigger } from "@/components/shared/tour-trigger";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/lib/api/endpoints/dashboard";

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => getDashboardStats(),
  });

  const stats = data?.data;

  const metrics = [
    {
      title: "Active Projects",
      value: stats?.activeProjects ?? 0,
      icon: FolderKanban,
      trend: "neutral" as const,
      trendValue: "---",
    },
    {
      title: "Pending Attestations",
      value: stats?.pendingAttestations ?? 0,
      icon: ClipboardCheck,
      trend: "neutral" as const,
      trendValue: "---",
    },
    {
      title: "Certificates Issued",
      value: stats?.certificatesIssued ?? 0,
      icon: Award,
      trend: "neutral" as const,
      trendValue: "---",
    },
    {
      title: "Open Disputes",
      value: stats?.openDisputes ?? 0,
      icon: AlertTriangle,
      trend: "neutral" as const,
      trendValue: "---",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of infrastructure projects and attestation activity.
          </p>
        </div>
        <DashboardTourTrigger />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load dashboard metrics</p>
          <Button variant="outline" className="mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity />
        <AttestationPipeline />
      </div>

      <ProjectsTable />
    </div>
  );
}

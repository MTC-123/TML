"use client";

import { useQuery } from "@tanstack/react-query";
import {
  HardHat,
  ClipboardCheck,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getMilestoneStatusDisplay } from "@/lib/formatters/status";
import { formatMADCompact } from "@/lib/formatters/currency";
import { getContractorStats } from "@/lib/api/endpoints/dashboard";
import { listProjects } from "@/lib/api/endpoints/projects";
import Link from "next/link";

export default function ContractorPage() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["contractor", "stats"],
    queryFn: () => getContractorStats(),
  });

  const { data: projectsData, isLoading: projectsLoading, error: projectsError, refetch } = useQuery({
    queryKey: ["contractor", "projects"],
    queryFn: () => listProjects({ limit: 10 }),
  });

  const stats = statsData?.data;
  const projects = projectsData?.data ?? [];

  const statCards = [
    { label: "My Projects", value: stats?.myProjects ?? 0, icon: HardHat, color: "text-[#1e3a5f]" },
    { label: "Milestones Completed", value: stats?.milestonesCompleted ?? 0, icon: ClipboardCheck, color: "text-[#2d8a4e]" },
    { label: "Pending Attestation", value: stats?.pendingAttestation ?? 0, icon: Clock, color: "text-[#d97706]" },
    { label: "Open Disputes", value: stats?.openDisputes ?? 0, icon: AlertTriangle, color: "text-[#dc2626]" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contractor Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your projects and milestones
        </p>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[80px] rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="pt-6 flex items-center gap-4">
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Projects</h2>
        </div>
        {projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-lg" />
            ))}
          </div>
        ) : projectsError ? (
          <div className="text-center py-8">
            <p className="text-sm text-destructive">Failed to load projects</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No projects found
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{project.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {project.region}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground capitalize">
                    Status: {project.status}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Link to milestones */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" asChild>
          <Link href="contractor/milestones">
            View All Milestones <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

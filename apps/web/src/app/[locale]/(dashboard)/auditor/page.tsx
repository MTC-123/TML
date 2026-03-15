"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuditorAssignmentStatusDisplay } from "@/lib/formatters/status";
import { formatDateShort } from "@/lib/formatters/date";
import { getAuditorStats } from "@/lib/api/endpoints/dashboard";
import Link from "next/link";

export default function AuditorPage() {
  const { data: statsData, isLoading: statsLoading, error, refetch } = useQuery({
    queryKey: ["auditor", "stats"],
    queryFn: () => getAuditorStats(),
  });

  const stats = statsData?.data;

  const statCards = [
    { label: "Assigned", value: stats?.assigned ?? 0, icon: ClipboardCheck, color: "text-[#1e3a5f]" },
    { label: "Pending Review", value: stats?.pendingReview ?? 0, icon: Clock, color: "text-[#d97706]" },
    { label: "Completed", value: stats?.completed ?? 0, icon: CheckCircle2, color: "text-[#2d8a4e]" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Auditor Dashboard</h1>
        <p className="text-muted-foreground">
          Your assigned milestones and pending reviews
        </p>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[80px] rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load auditor stats</p>
          <Button variant="outline" className="mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
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

      {/* Link to full assignments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pending Reviews</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="auditor/assignments">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Go to the assignments page to see all your current and past audit assignments.
        </p>
      </div>
    </div>
  );
}

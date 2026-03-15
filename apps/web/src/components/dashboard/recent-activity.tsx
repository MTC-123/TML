"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ClipboardCheck,
  Award,
  AlertTriangle,
  FolderKanban,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRecentActivity, type ActivityItem } from "@/lib/api/endpoints/dashboard";

const iconMap = {
  attestation: ClipboardCheck,
  certificate: Award,
  dispute: AlertTriangle,
  project: FolderKanban,
  user: UserCheck,
};

const iconColorMap = {
  attestation: "text-[#2d8a4e] bg-[#2d8a4e]/10",
  certificate: "text-[#1e3a5f] bg-[#1e3a5f]/10",
  dispute: "text-[#d97706] bg-[#d97706]/10",
  project: "text-[#1e3a5f] bg-[#1e3a5f]/10",
  user: "text-[#2d8a4e] bg-[#2d8a4e]/10",
};

export function RecentActivity() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", "recent-activity"],
    queryFn: () => getRecentActivity(),
  });

  const activities: ActivityItem[] = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-destructive">Failed to load activity</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = iconMap[activity.type] ?? FolderKanban;
              const colorClass = iconColorMap[activity.type] ?? iconColorMap.project;
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                >
                  <div
                    className={cn(
                      "mt-0.5 rounded-lg p-2",
                      colorClass,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-relaxed">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

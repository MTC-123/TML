"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getAttestationPipeline, type PipelineStage } from "@/lib/api/endpoints/dashboard";

const COLORS = [
  "bg-[#1e3a5f]",
  "bg-[#2d8a4e]",
  "bg-[#d97706]",
  "bg-[#1e3a5f]",
];

export function AttestationPipeline() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", "attestation-pipeline"],
    queryFn: () => getAttestationPipeline(),
  });

  const stages: PipelineStage[] = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Attestation Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-destructive">Failed to load pipeline data</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : stages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No pipeline data available
          </p>
        ) : (
          <div className="space-y-5">
            {stages.map((stage, index) => {
              const percentage =
                stage.total > 0
                  ? Math.round((stage.completed / stage.total) * 100)
                  : 0;
              const color = COLORS[index % COLORS.length];
              return (
                <div key={stage.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.label}</span>
                    <span className="text-muted-foreground">
                      {stage.completed}/{stage.total}
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all ${color}`}
                      style={{ width: `${percentage}%` }}
                    />
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

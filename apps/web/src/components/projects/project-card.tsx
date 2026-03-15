"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProjectStatusDisplay } from "@/lib/formatters/status";
import { formatMADCompact } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { MapPin, Banknote } from "lucide-react";
import type { ProjectResponse } from "@tml/types";

interface ProjectCardProps {
  project: ProjectResponse;
  milestoneCount?: number;
  completedMilestones?: number;
  className?: string;
}

export function ProjectCard({
  project,
  milestoneCount,
  completedMilestones,
  className,
}: ProjectCardProps) {
  const status = getProjectStatusDisplay(project.status);
  const progress =
    milestoneCount && milestoneCount > 0
      ? Math.round(((completedMilestones ?? 0) / milestoneCount) * 100)
      : 0;

  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card className={cn("h-full transition-colors hover:border-[#1e3a5f]/30", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
            <Badge variant={status.variant} className="shrink-0">
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{project.region}</span>
            </div>
            <div className="flex items-center gap-1">
              <Banknote className="h-3.5 w-3.5" />
              <span>{formatMADCompact(project.budget)}</span>
            </div>
          </div>

          {milestoneCount !== undefined && (
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Milestones</span>
                <span>
                  {completedMilestones ?? 0}/{milestoneCount}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#2d8a4e] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {project.donor && (
            <p className="text-xs text-muted-foreground">Donor: {project.donor}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

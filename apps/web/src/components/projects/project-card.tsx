"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Building2, Calendar } from "lucide-react";
import { formatMADCompact } from "@/lib/formatters/currency";
import { getStatusDisplay, getStatusBadgeVariant } from "@/lib/formatters/status";
import type { ProjectResponse } from "@tml/types";

interface ProjectCardProps {
  project: ProjectResponse;
  milestoneCount?: number;
  completedMilestones?: number;
}

export function ProjectCard({
  project,
  milestoneCount,
  completedMilestones,
}: ProjectCardProps) {
  const statusInfo = getStatusDisplay("project", project.status);
  const variant = getStatusBadgeVariant(project.status);
  const progress =
    milestoneCount && milestoneCount > 0
      ? Math.round((completedMilestones ?? 0 / milestoneCount) * 100)
      : 0;

  return (
    <Link href={`/projects/${project.id}` as any} className="block group">
      <Card className="transition-all duration-200 hover:shadow-lg hover:border-accent/30 group-hover:-translate-y-0.5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight line-clamp-2">
              {project.name}
            </CardTitle>
            <Badge variant={variant as "default" | "secondary" | "destructive" | "outline"}>
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{project.region}</span>
          </div>

          {project.budget && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span>{formatMADCompact(Number(project.budget))}</span>
            </div>
          )}

          {project.donor && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>Donor: {project.donor}</span>
            </div>
          )}

          {milestoneCount !== undefined && milestoneCount > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Milestones</span>
                <span className="font-medium">
                  {completedMilestones ?? 0}/{milestoneCount}
                </span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

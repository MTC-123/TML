"use client";

import { Badge } from "@/components/ui/badge";
import { getMilestoneStatusDisplay } from "@/lib/formatters/status";
import { formatDate } from "@/lib/formatters/date";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import type { MilestoneResponse } from "@tml/types";

interface MilestoneTimelineProps {
  milestones: MilestoneResponse[];
  projectId: string;
  className?: string;
}

function getStatusIcon(status: MilestoneResponse["status"]) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-[#2d8a4e]" />;
    case "in_progress":
    case "attestation_in_progress":
      return <Clock className="h-5 w-5 text-[#d97706]" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-[#dc2626]" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground" />;
  }
}

export function MilestoneTimeline({ milestones, projectId, className }: MilestoneTimelineProps) {
  const sorted = [...milestones].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No milestones have been created yet.
      </p>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {sorted.map((milestone, index) => {
        const status = getMilestoneStatusDisplay(milestone.status);
        const isLast = index === sorted.length - 1;
        const isOverdue =
          new Date(milestone.deadline) < new Date() && milestone.status !== "completed";

        return (
          <div key={milestone.id} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-border" />
            )}

            {/* Icon */}
            <div className="relative z-10 mt-0.5 shrink-0">
              {getStatusIcon(milestone.status)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/projects/${projectId}/milestones/${milestone.id}`}
                className="group block rounded-lg border p-4 transition-colors hover:border-[#1e3a5f]/30 hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Milestone {milestone.sequenceNumber}
                    </p>
                    <p className="font-medium group-hover:text-[#1e3a5f] transition-colors">
                      {milestone.description}
                    </p>
                  </div>
                  <Badge variant={status.variant} className="shrink-0">
                    {status.label}
                  </Badge>
                </div>
                <p className={cn(
                  "text-xs",
                  isOverdue ? "text-[#dc2626] font-medium" : "text-muted-foreground"
                )}>
                  Deadline: {formatDate(milestone.deadline)}
                </p>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Clock, AlertTriangle, Circle } from "lucide-react";
import type { MilestoneResponse } from "@tml/types";

interface MilestoneTimelineProps {
  milestones: MilestoneResponse[];
  projectId: string;
}

const statusConfig: Record<
  string,
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  completed: {
    icon: Check,
    color: "text-accent",
    bgColor: "bg-accent",
    label: "Completed",
  },
  in_progress: {
    icon: Clock,
    color: "text-warning",
    bgColor: "bg-warning",
    label: "In Progress",
  },
  pending: {
    icon: Circle,
    color: "text-muted-foreground",
    bgColor: "bg-muted-foreground",
    label: "Pending",
  },
  failed: {
    icon: AlertTriangle,
    color: "text-destructive",
    bgColor: "bg-destructive",
    label: "Failed",
  },
};

export function MilestoneTimeline({
  milestones,
  projectId,
}: MilestoneTimelineProps) {
  if (milestones.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No milestones have been created yet.
      </div>
    );
  }

  const sorted = [...milestones].sort(
    (a, b) => a.sequenceNumber - b.sequenceNumber,
  );

  return (
    <div className="relative space-y-0">
      {sorted.map((ms, index) => {
        const config = statusConfig[ms.status] ?? statusConfig["pending"]!;
        const StatusIcon = config!.icon;
        const isLast = index === sorted.length - 1;

        return (
          <div key={ms.id} className="relative flex gap-4 pb-8">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[15px] top-[32px] h-[calc(100%-16px)] w-0.5 bg-border" />
            )}

            {/* Circle indicator */}
            <div
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white",
                config.bgColor,
              )}
            >
              <StatusIcon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  Milestone {ms.sequenceNumber}
                </span>
                <Badge
                  variant={
                    ms.status === "completed"
                      ? "default"
                      : ms.status === "failed"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-xs"
                >
                  {config.label}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {ms.description}
              </p>
              {ms.deadline && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Deadline:{" "}
                  {new Date(ms.deadline).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

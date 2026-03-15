"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMilestoneStatusDisplay } from "@/lib/formatters/status";
import { formatDate } from "@/lib/formatters/date";
import { cn } from "@/lib/utils";
import { Calendar, Hash } from "lucide-react";
import type { MilestoneResponse } from "@tml/types";

interface MilestoneCardProps {
  milestone: MilestoneResponse;
  onClick?: () => void;
  className?: string;
}

export function MilestoneCard({ milestone, onClick, className }: MilestoneCardProps) {
  const status = getMilestoneStatusDisplay(milestone.status);
  const isOverdue = new Date(milestone.deadline) < new Date() && milestone.status !== "completed";

  return (
    <Card
      className={cn("cursor-pointer transition-colors hover:border-[#1e3a5f]/30", className)}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2">{milestone.description}</CardTitle>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Hash className="h-3.5 w-3.5" />
            <span>Milestone {milestone.sequenceNumber}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span className={cn(isOverdue && "text-[#dc2626] font-medium")}>
              {formatDate(milestone.deadline)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

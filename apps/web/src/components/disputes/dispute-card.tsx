"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDisputeStatusDisplay } from "@/lib/formatters/status";
import { formatDateShort } from "@/lib/formatters/date";
import type { DisputeStatus } from "@tml/types";

interface DisputeCardProps {
  id: string;
  reason: string;
  status: DisputeStatus;
  createdAt: string;
  milestoneTitle?: string;
  filedBy?: string;
}

export function DisputeCard({
  id,
  reason,
  status,
  createdAt,
  milestoneTitle,
  filedBy,
}: DisputeCardProps) {
  const statusDisplay = getDisputeStatusDisplay(status);

  return (
    <Link href={`disputes/${id}`}>
      <Card className="hover:border-[#d97706]/30 transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#d97706]" />
            <CardTitle className="text-sm">{reason}</CardTitle>
          </div>
          <Badge variant={statusDisplay.variant}>{statusDisplay.label}</Badge>
        </CardHeader>
        <CardContent>
          {milestoneTitle && (
            <p className="text-sm text-muted-foreground mb-1">{milestoneTitle}</p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Filed {formatDateShort(createdAt)}</span>
            {filedBy && <span>by {filedBy}</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

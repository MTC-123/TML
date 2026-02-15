"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, User } from "lucide-react";

interface DisputeCardProps {
  id: string;
  reason: string;
  status: "open" | "under_review" | "resolved" | "dismissed";
  createdAt: string;
  milestoneTitle?: string;
  filedBy?: string;
}

const statusLabels: Record<string, string> = {
  open: "Open",
  under_review: "Under Review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

export function DisputeCard({
  id,
  reason,
  status,
  createdAt,
  milestoneTitle,
  filedBy,
}: DisputeCardProps) {
  const dateStr = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`disputes/${id}` as any} className="block group">
      <Card className="transition-all duration-200 hover:shadow-lg hover:border-warning/30 group-hover:-translate-y-0.5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-semibold text-muted-foreground">
                Dispute
              </span>
            </div>
            <Badge
              variant={
                status === "resolved"
                  ? "default"
                  : status === "open"
                    ? "destructive"
                    : "secondary"
              }
              className={
                status === "resolved"
                  ? "bg-accent text-white hover:bg-accent/90"
                  : ""
              }
            >
              {statusLabels[status] ?? status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm leading-relaxed">{reason}</p>

          {milestoneTitle && (
            <p className="text-xs font-medium text-primary">
              {milestoneTitle}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{dateStr}</span>
            </div>
            {filedBy && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>by {filedBy}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

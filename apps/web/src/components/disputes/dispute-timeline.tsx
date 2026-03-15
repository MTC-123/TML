"use client";

import { Circle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/formatters/date";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  status: "completed" | "active" | "dismissed" | "pending";
}

interface DisputeTimelineProps {
  events: TimelineEvent[];
}

const statusIcons = {
  completed: CheckCircle2,
  active: Clock,
  dismissed: XCircle,
  pending: Circle,
};

const statusColors = {
  completed: "text-[#2d8a4e]",
  active: "text-[#d97706]",
  dismissed: "text-[#dc2626]",
  pending: "text-muted-foreground",
};

export function DisputeTimeline({ events }: DisputeTimelineProps) {
  return (
    <div className="space-y-0">
      {events.map((event, idx) => {
        const Icon = statusIcons[event.status];
        const isLast = idx === events.length - 1;

        return (
          <div key={event.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <Icon className={cn("h-5 w-5 shrink-0", statusColors[event.status])} />
              {!isLast && <div className="w-px flex-1 bg-border my-1" />}
            </div>
            <div className={cn("pb-6", isLast && "pb-0")}>
              <p className="text-sm font-medium">{event.title}</p>
              {event.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {event.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {formatDateTime(event.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

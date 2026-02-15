"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import type { QuorumBreakdownResponse } from "@tml/types";

interface QuorumProgressBarProps {
  quorum: QuorumBreakdownResponse;
}

export function QuorumProgressBar({ quorum }: QuorumProgressBarProps) {
  const segments = [
    {
      label: "Inspectors",
      current: quorum.inspector.current,
      required: quorum.inspector.required,
      met: quorum.inspector.met,
      color: "#1e3a5f",
    },
    {
      label: "Auditors",
      current: quorum.auditor.current,
      required: quorum.auditor.required,
      met: quorum.auditor.met,
      color: "#2d8a4e",
    },
    {
      label: "Citizens",
      current: quorum.citizen.weightedScore,
      required: quorum.citizen.required,
      met: quorum.citizen.met,
      color: "#d97706",
    },
  ];

  return (
    <div className="space-y-4">
      {segments.map((seg) => {
        const pct = seg.required > 0
          ? Math.min(100, Math.round((seg.current / seg.required) * 100))
          : 0;

        return (
          <div key={seg.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{seg.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {seg.current}/{seg.required}
                </span>
                {seg.met ? (
                  <Check className="h-3.5 w-3.5 text-accent" />
                ) : (
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </div>
            <Progress
              value={pct}
              className="h-2"
            />
          </div>
        );
      })}

      <div className="flex items-center justify-center pt-2">
        {quorum.overallMet ? (
          <Badge className="bg-accent text-white hover:bg-accent/90">
            <Check className="mr-1 h-3 w-3" />
            Quorum requirements met
          </Badge>
        ) : (
          <Badge variant="secondary">
            <X className="mr-1 h-3 w-3" />
            Quorum not yet met
          </Badge>
        )}
      </div>
    </div>
  );
}

"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Shield, UserCheck, Users } from "lucide-react";
import type { QuorumBreakdownResponse } from "@tml/types";

interface QuorumProgressBarProps {
  quorum: QuorumBreakdownResponse;
  className?: string;
}

interface RoleProgressProps {
  label: string;
  current: number;
  required: number;
  met: boolean;
  icon: React.ReactNode;
}

function RoleProgress({ label, current, required, met, icon }: RoleProgressProps) {
  const percentage = required > 0 ? Math.min((current / required) * 100, 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <span className={cn("font-mono text-xs", met ? "text-[#2d8a4e]" : "text-muted-foreground")}>
          {current}/{required}
        </span>
      </div>
      <Progress
        value={percentage}
        className={cn("h-2", met && "[&>div]:bg-[#2d8a4e]")}
      />
    </div>
  );
}

export function QuorumProgressBar({ quorum, className }: QuorumProgressBarProps) {
  const citizenCurrent = Math.round(quorum.citizen.weightedScore);

  return (
    <div className={cn("space-y-4", className)}>
      <RoleProgress
        label="Inspectors"
        current={quorum.inspector.current}
        required={quorum.inspector.required}
        met={quorum.inspector.met}
        icon={<UserCheck className="h-4 w-4 text-[#1e3a5f]" />}
      />
      <RoleProgress
        label="Auditors"
        current={quorum.auditor.current}
        required={quorum.auditor.required}
        met={quorum.auditor.met}
        icon={<Shield className="h-4 w-4 text-[#1e3a5f]" />}
      />
      <RoleProgress
        label="Citizens"
        current={citizenCurrent}
        required={quorum.citizen.required}
        met={quorum.citizen.met}
        icon={<Users className="h-4 w-4 text-[#1e3a5f]" />}
      />
      <div className="pt-2 border-t">
        <p className={cn(
          "text-sm font-medium",
          quorum.overallMet ? "text-[#2d8a4e]" : "text-muted-foreground"
        )}>
          {quorum.overallMet ? "Quorum requirements met" : "Quorum not yet met"}
        </p>
      </div>
    </div>
  );
}

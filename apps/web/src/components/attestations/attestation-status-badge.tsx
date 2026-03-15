"use client";

import { Badge } from "@/components/ui/badge";
import { getAttestationStatusDisplay } from "@/lib/formatters/status";
import type { AttestationStatus } from "@tml/types";

const variantClassMap: Record<string, string> = {
  default: "bg-[#1e3a5f] text-white",
  success: "bg-[#2d8a4e] text-white",
  warning: "bg-amber-600 text-white",
  destructive: "bg-red-600 text-white",
  secondary: "bg-gray-200 text-gray-800",
};

interface AttestationStatusBadgeProps {
  status: AttestationStatus;
}

export function AttestationStatusBadge({ status }: AttestationStatusBadgeProps) {
  const display = getAttestationStatusDisplay(status);

  return (
    <Badge className={variantClassMap[display.variant] ?? ""}>
      {display.label}
    </Badge>
  );
}

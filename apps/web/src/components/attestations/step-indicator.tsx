"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "GPS Location" },
  { label: "Evidence" },
  { label: "Signature" },
  { label: "Review" },
];

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between w-full">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold",
                  isCompleted && "border-[#2d8a4e] bg-[#2d8a4e] text-white",
                  isCurrent && "border-[#1e3a5f] bg-[#1e3a5f] text-white",
                  !isCompleted && !isCurrent && "border-gray-300 text-gray-400",
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  isCurrent && "text-[#1e3a5f]",
                  isCompleted && "text-[#2d8a4e]",
                  !isCompleted && !isCurrent && "text-gray-400",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-3 mt-[-1.25rem]",
                  index < currentStep ? "bg-[#2d8a4e]" : "bg-gray-300",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

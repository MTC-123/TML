"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

export function LoadingSpinner({ text, className }: LoadingSpinnerProps) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1e3a5f] border-t-transparent" aria-hidden="true" />
      {text ? (
        <p className="text-sm text-muted-foreground">{text}</p>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}

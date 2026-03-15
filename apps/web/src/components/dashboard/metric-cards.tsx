"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend: "up" | "down" | "neutral";
  trendValue: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
}: MetricCardProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          </div>
          <div className="rounded-lg bg-[#1e3a5f]/10 p-3">
            <Icon className="h-6 w-6 text-[#1e3a5f]" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1 text-sm">
          <TrendIcon
            className={cn(
              "h-4 w-4",
              trend === "up" && "text-[#2d8a4e]",
              trend === "down" && "text-[#dc2626]",
              trend === "neutral" && "text-muted-foreground",
            )}
          />
          <span
            className={cn(
              "font-medium",
              trend === "up" && "text-[#2d8a4e]",
              trend === "down" && "text-[#dc2626]",
              trend === "neutral" && "text-muted-foreground",
            )}
          >
            {trendValue}
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
}

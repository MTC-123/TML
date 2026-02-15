"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <div className="mt-1 flex items-center gap-1 text-xs">
          {trend === "up" && (
            <TrendingUp className="h-3 w-3 text-accent" />
          )}
          {trend === "down" && (
            <TrendingDown className="h-3 w-3 text-destructive" />
          )}
          {trend === "neutral" && (
            <Minus className="h-3 w-3 text-muted-foreground" />
          )}
          <span
            className={cn(
              "font-medium",
              trend === "up" && "text-accent",
              trend === "down" && "text-destructive",
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

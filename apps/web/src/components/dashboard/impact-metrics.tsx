'use client';

import { type LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ImpactMetricProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  icon?: LucideIcon;
}

export function ImpactMetric({ label, value, trend, icon: Icon }: ImpactMetricProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400';

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        {Icon && <Icon className="h-5 w-5 text-gray-400" />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-3xl font-bold text-[#1e3a5f] dark:text-white">{value}</p>
        {trend && (
          <span className={`flex items-center text-sm ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );
}

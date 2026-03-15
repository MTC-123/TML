'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Shield,
  Users,
  Clock,
  Banknote,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Activity,
  FileCheck,
  Vote,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  getImpactDashboard,
  type ImpactMetric,
  type ImpactDashboardData,
} from '@/lib/api/endpoints/impact';

// ---------------------------------------------------------------------------
// Icon/style mapping for metrics (by index or label)
// ---------------------------------------------------------------------------
const METRIC_STYLES = [
  {
    icon: Building2,
    borderColor: 'border-t-[#1e3a5f]',
    iconBg: 'bg-[#1e3a5f]/10',
    iconColor: 'text-[#1e3a5f]',
  },
  {
    icon: Shield,
    borderColor: 'border-t-[#10b981]',
    iconBg: 'bg-[#10b981]/10',
    iconColor: 'text-[#10b981]',
  },
  {
    icon: Users,
    borderColor: 'border-t-[#d4a017]',
    iconBg: 'bg-[#d4a017]/10',
    iconColor: 'text-[#d4a017]',
  },
  {
    icon: Clock,
    borderColor: 'border-t-[#10b981]',
    iconBg: 'bg-[#10b981]/10',
    iconColor: 'text-[#10b981]',
  },
  {
    icon: Banknote,
    borderColor: 'border-t-[#1e3a5f]',
    iconBg: 'bg-[#1e3a5f]/10',
    iconColor: 'text-[#1e3a5f]',
  },
];

// ---------------------------------------------------------------------------
// Animated counter hook
// ---------------------------------------------------------------------------
function useAnimatedCounter(target: number, duration = 2000, startOnMount = true): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    },
    [target, duration],
  );

  useEffect(() => {
    if (!startOnMount) return;
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate, startOnMount]);

  return value;
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------
function MetricCard({
  metric,
  index,
}: {
  metric: ImpactMetric;
  index: number;
}) {
  const style = METRIC_STYLES[index % METRIC_STYLES.length]!;
  const count = useAnimatedCounter(metric.value, 2000 + index * 200);
  const Icon = style.icon;
  const trend = metric.trend;
  const TrendIcon =
    trend === 'up'
      ? TrendingUp
      : trend === 'down'
        ? TrendingDown
        : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-[#10b981]'
      : trend === 'down'
        ? 'text-red-500'
        : 'text-gray-400';

  return (
    <div
      className={`animate-fade-up stagger-${index + 1} group relative overflow-hidden rounded-xl border-t-4 ${style.borderColor} bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${style.iconBg}`}>
          <Icon className={`h-5 w-5 ${style.iconColor}`} />
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          {metric.trendValue}
        </span>
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {metric.label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-[#0a1628]">
        {metric.value >= 1000
          ? count.toLocaleString()
          : count}
        {metric.suffix}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Line Chart — Attestations Over Time
// ---------------------------------------------------------------------------
function AttestationsLineChart({
  months,
  values,
}: {
  months: string[];
  values: number[];
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const maxValue = Math.max(...values, 1);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  const W = 560;
  const H = 240;
  const PAD_L = 40;
  const PAD_R = 20;
  const PAD_T = 20;
  const PAD_B = 36;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const points = values.map((v, i) => ({
    x: PAD_L + (i / Math.max(values.length - 1, 1)) * chartW,
    y: PAD_T + chartH - (v / (maxValue * 1.15)) * chartH,
    value: v,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const lastPt = points[points.length - 1]!;
  const firstPt = points[0]!;
  const areaPath = `${linePath} L${lastPt.x},${PAD_T + chartH} L${firstPt.x},${PAD_T + chartH} Z`;

  // Horizontal grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const y = PAD_T + chartH - pct * chartH;
    const label = Math.round(pct * maxValue * 1.15);
    return { y, label };
  });

  return (
    <div className="animate-fade-up stagger-2 rounded-xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#0a1628]">
        Attestations Over Time
      </h3>
      <p className="mb-4 text-xs text-gray-400">Monthly attestation submissions across all projects</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {gridLines.map((g) => (
          <g key={g.label}>
            <line x1={PAD_L} x2={W - PAD_R} y1={g.y} y2={g.y} stroke="#e5e7eb" strokeWidth={0.7} />
            <text x={PAD_L - 6} y={g.y + 3} textAnchor="end" className="fill-gray-400" fontSize={9}>
              {g.label}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <defs>
          <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <path
          d={areaPath}
          fill="url(#areaGrad)"
          opacity={visible ? 1 : 0}
          style={{ transition: 'opacity 0.8s ease' }}
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#10b981"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={visible ? '0' : '2000'}
          strokeDashoffset={visible ? '0' : '2000'}
          style={{ transition: 'stroke-dashoffset 1.5s ease, stroke-dasharray 1.5s ease' }}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer' }}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={hovered === i ? 6 : 4}
              fill={hovered === i ? '#d4a017' : '#10b981'}
              stroke="white"
              strokeWidth={2}
              style={{ transition: 'all 0.2s ease' }}
            />
            {hovered === i && (
              <>
                <rect
                  x={p.x - 22}
                  y={p.y - 28}
                  width={44}
                  height={20}
                  rx={4}
                  fill="#0a1628"
                />
                <text
                  x={p.x}
                  y={p.y - 15}
                  textAnchor="middle"
                  fill="white"
                  fontSize={11}
                  fontWeight={700}
                >
                  {p.value}
                </text>
              </>
            )}
          </g>
        ))}

        {/* X-axis labels */}
        {months.map((m, i) => (
          <text
            key={m}
            x={PAD_L + (i / Math.max(months.length - 1, 1)) * chartW}
            y={H - 6}
            textAnchor="middle"
            className="fill-gray-400"
            fontSize={10}
          >
            {m}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Donut Chart — Attestations by Role
// ---------------------------------------------------------------------------
function RoleDonutChart({
  roleData,
}: {
  roleData: Array<{ label: string; value: number; color: string }>;
}) {
  const [visible, setVisible] = useState(false);
  const roleTotal = roleData.reduce((s, d) => s + d.value, 0);
  const totalAnimated = useAnimatedCounter(roleTotal, 2200);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  const SIZE = 200;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 72;
  const STROKE = 22;
  const CIRC = 2 * Math.PI * R;

  let cumulative = 0;
  const segments = roleData.map((d) => {
    const pct = d.value / (roleTotal || 1);
    const dashArray = `${pct * CIRC} ${CIRC}`;
    const offset = -cumulative * CIRC;
    cumulative += pct;
    return { ...d, dashArray, offset, pct };
  });

  return (
    <div className="animate-fade-up stagger-3 rounded-xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#0a1628]">
        Attestations by Role
      </h3>
      <p className="mb-4 text-xs text-gray-400">Distribution of attestations by stakeholder type</p>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
          {/* Background ring */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />

          {/* Segments */}
          {segments.map((seg) => (
            <circle
              key={seg.label}
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth={STROKE}
              strokeDasharray={visible ? seg.dashArray : `0 ${CIRC}`}
              strokeDashoffset={seg.offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${CX} ${CY})`}
              style={{ transition: 'stroke-dasharray 1.2s ease' }}
            />
          ))}

          {/* Center text */}
          <text x={CX} y={CY - 6} textAnchor="middle" fontSize={26} fontWeight={800} fill="#0a1628">
            {totalAnimated.toLocaleString()}
          </text>
          <text x={CX} y={CY + 14} textAnchor="middle" fontSize={10} fill="#9ca3af" letterSpacing={1}>
            TOTAL
          </text>
        </svg>

        {/* Legend */}
        <div className="flex flex-col gap-3">
          {roleData.map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-sm text-gray-600 w-20">{d.label}</span>
              <span className="text-sm font-semibold text-[#0a1628]">{d.value.toLocaleString()}</span>
              <span className="text-xs text-gray-400">
                ({Math.round((d.value / (roleTotal || 1)) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizontal Bar Chart — Projects by Region
// ---------------------------------------------------------------------------
function RegionBarChart({
  regionData,
}: {
  regionData: Array<{ region: string; value: number }>;
}) {
  const [visible, setVisible] = useState(false);
  const regionMax = Math.max(...regionData.map((d) => d.value), 1);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="animate-fade-up stagger-4 rounded-xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#0a1628]">
        Projects by Region
      </h3>
      <p className="mb-5 text-xs text-gray-400">Geographic distribution of monitored infrastructure projects</p>

      <div className="flex flex-col gap-4">
        {regionData.map((d, i) => {
          const pct = (d.value / regionMax) * 100;
          return (
            <div key={d.region} className="group">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-gray-600">{d.region}</span>
                <span className="text-sm font-bold text-[#0a1628]">{d.value}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: visible ? `${pct}%` : '0%',
                    background: `linear-gradient(90deg, #1e3a5f, #2d5a8e)`,
                    transitionDelay: `${i * 120}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fund Disbursement Chart
// ---------------------------------------------------------------------------
function FundDisbursementChart({
  months,
  values,
  total,
}: {
  months: string[];
  values: number[];
  total: number;
}) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const fundMax = Math.max(...values, 1);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="animate-fade-up stagger-5 rounded-xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#0a1628]">
            Fund Disbursement
          </h3>
          <p className="text-xs text-gray-400">Monthly cleared amounts (MAD)</p>
        </div>
        <div className="text-right">
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#d4a017]">
            {total.toFixed(1)}M
          </p>
          <p className="text-[10px] uppercase tracking-wider text-gray-400">Total YTD</p>
        </div>
      </div>

      <div className="flex h-40 items-end gap-1.5 sm:gap-2">
        {values.map((v, i) => {
          const heightPct = (v / fundMax) * 100;
          return (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {hovered === i && (
                <div className="absolute -top-8 rounded bg-[#0a1628] px-2 py-1 text-[10px] font-bold text-white shadow-lg whitespace-nowrap z-10">
                  {v}M MAD
                </div>
              )}
              <div
                className="w-full rounded-t-md transition-all duration-700 ease-out cursor-pointer"
                style={{
                  height: visible ? `${heightPct}%` : '0%',
                  background:
                    hovered === i
                      ? 'linear-gradient(180deg, #d4a017, #b8860b)'
                      : 'linear-gradient(180deg, #d4a017, #d4a01766)',
                  transitionDelay: `${i * 80}ms`,
                  opacity: hovered !== null && hovered !== i ? 0.5 : 1,
                }}
              />
              <span className="mt-1.5 text-[9px] text-gray-400">{months[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity Feed
// ---------------------------------------------------------------------------
function ActivityFeed({
  activities,
}: {
  activities: Array<{ type: 'certificate' | 'attestation'; text: string; time: string }>;
}) {
  return (
    <div className="animate-fade-up stagger-5 rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Activity className="h-5 w-5 text-[#1e3a5f]" />
        <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#0a1628]">
          Recent Activity
        </h3>
      </div>

      {activities.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No recent activity</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {activities.map((a, i) => {
            const isCert = a.type === 'certificate';
            return (
              <div key={i} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                <span
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    isCert ? 'bg-[#10b981]' : 'bg-[#1e3a5f]'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700 leading-snug">{a.text}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">{a.time}</p>
                </div>
                {isCert ? (
                  <FileCheck className="h-4 w-4 shrink-0 text-[#10b981]" />
                ) : (
                  <Vote className="h-4 w-4 shrink-0 text-[#1e3a5f]" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton for the entire dashboard
// ---------------------------------------------------------------------------
function ImpactSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-2 sm:p-6">
      <div className="space-y-2">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[140px] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[300px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[260px] rounded-xl" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ImpactDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['impact-dashboard'],
    queryFn: () => getImpactDashboard(),
  });

  if (isLoading) {
    return <ImpactSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6 text-center">
        <p className="text-destructive">Failed to load impact data</p>
        <Button variant="outline" className="mt-2" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const dashboard: ImpactDashboardData = data?.data ?? {
    metrics: [],
    attestationsOverTime: { months: [], values: [] },
    attestationsByRole: [],
    projectsByRegion: [],
    fundDisbursement: { months: [], values: [], total: 0 },
    recentActivity: [],
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-2 sm:p-6">
      {/* ---- Header ---- */}
      <div className="animate-fade-up stagger-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[#0a1628] sm:text-5xl">
            Impact Dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm text-gray-500 leading-relaxed">
            Real-time transparency metrics across Morocco&apos;s public infrastructure
          </p>
          {/* Gold accent line */}
          <div className="mt-3 h-1 w-20 rounded-full bg-[#d4a017]" />
        </div>

        <div className="flex items-center gap-4">
          <p className="text-xs text-gray-400">
            Last updated:{' '}
            <span className="font-medium text-gray-600">
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[#1e3a5f] shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* ---- Metric Cards ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {dashboard.metrics.map((m, i) => (
          <MetricCard key={m.label} metric={m} index={i} />
        ))}
      </div>

      {/* ---- Charts 2x2 ---- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AttestationsLineChart
          months={dashboard.attestationsOverTime.months}
          values={dashboard.attestationsOverTime.values}
        />
        <RoleDonutChart roleData={dashboard.attestationsByRole} />
        <RegionBarChart regionData={dashboard.projectsByRegion} />
        <FundDisbursementChart
          months={dashboard.fundDisbursement.months}
          values={dashboard.fundDisbursement.values}
          total={dashboard.fundDisbursement.total}
        />
      </div>

      {/* ---- Activity Feed ---- */}
      <ActivityFeed activities={dashboard.recentActivity} />
    </div>
  );
}

"use client";

import { useAuthStore } from "@/store/auth-store";
import { useProjects, useAttestations, useCertificates, useDisputes } from "@/hooks/use-api";
import { MetricCard } from "@/components/dashboard/metric-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FolderKanban,
  ClipboardCheck,
  FileCheck,
  AlertTriangle,
  Users,
  TrendingUp,
  MapPin,
  Clock,
  HardHat,
  Eye,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

// ─── Dummy Data ─────────────────────────────────────────────────

const projectHealthData = [
  { month: "Aug", active: 4, completed: 1 },
  { month: "Sep", active: 5, completed: 2 },
  { month: "Oct", active: 7, completed: 3 },
  { month: "Nov", active: 8, completed: 4 },
  { month: "Dec", active: 6, completed: 6 },
  { month: "Jan", active: 9, completed: 7 },
  { month: "Feb", active: 12, completed: 8 },
];

const attestationBreakdown = [
  { name: "Inspector", value: 34, color: "#1e3a5f" },
  { name: "Auditor", value: 21, color: "#2d8a4e" },
  { name: "Citizen (Biometric)", value: 28, color: "#d97706" },
  { name: "Citizen (USSD)", value: 15, color: "#1e3a5f" },
  { name: "CSO Mediated", value: 8, color: "#dc2626" },
];

const certificateIssuanceData = [
  { week: "W1", count: 2 },
  { week: "W2", count: 4 },
  { week: "W3", count: 3 },
  { week: "W4", count: 7 },
  { week: "W5", count: 5 },
  { week: "W6", count: 9 },
  { week: "W7", count: 11 },
  { week: "W8", count: 8 },
];

const recentActivity = [
  {
    id: "1",
    type: "attestation",
    description: "Inspector verified Milestone 3 — Route Nationale N8",
    actor: "Mohammed Alami",
    time: "12 min ago",
    icon: ClipboardCheck,
    iconColor: "text-accent",
  },
  {
    id: "2",
    type: "certificate",
    description: "Payment Clearance Certificate issued — Stade Mohammed V, MS-2",
    actor: "System",
    time: "34 min ago",
    icon: FileCheck,
    iconColor: "text-primary",
  },
  {
    id: "3",
    type: "dispute",
    description: "Dispute raised on Milestone 4 — Barrage Al Massira",
    actor: "Fatima Zahra",
    time: "1h ago",
    icon: AlertTriangle,
    iconColor: "text-warning",
  },
  {
    id: "4",
    type: "attestation",
    description: "Citizen USSD attestation — Route Nationale N8, MS-2",
    actor: "USSD +212xxxxxxxx",
    time: "2h ago",
    icon: ClipboardCheck,
    iconColor: "text-primary",
  },
  {
    id: "5",
    type: "project",
    description: "New project created — Centre Hospitalier Kénitra",
    actor: "Admin",
    time: "3h ago",
    icon: FolderKanban,
    iconColor: "text-primary",
  },
];

const regionCoverage = [
  { region: "Rabat-Salé-Kénitra", projects: 4, budget: "42M MAD" },
  { region: "Casablanca-Settat", projects: 3, budget: "38M MAD" },
  { region: "Tanger-Tétouan-Al Hoceïma", projects: 2, budget: "25M MAD" },
  { region: "Fès-Meknès", projects: 2, budget: "18M MAD" },
  { region: "Marrakech-Safi", projects: 1, budget: "12M MAD" },
];

// ─── Component ──────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.roles?.[0] ?? "inspector";

  // Fetch live counts from API (returns null when API is down)
  const { data: projectsData } = useProjects({ limit: 1 });
  const { data: attestationsData } = useAttestations();
  const { data: certificatesData } = useCertificates();
  const { data: disputesData } = useDisputes();

  const projectCount = projectsData?.meta?.total ?? 12;
  const attestationCount = attestationsData?.meta?.total ?? 106;
  const certificateCount = certificatesData?.meta?.total ?? 49;
  const disputeCount = disputesData?.meta?.total ?? 3;

  const isLive =
    projectsData !== null &&
    projectsData !== undefined &&
    attestationsData !== null &&
    attestationsData !== undefined;

  const roleConfig: Record<string, { icon: typeof HardHat; color: string; bg: string; label: string; greeting: string }> = {
    inspector: {
      icon: HardHat,
      color: "text-warning",
      bg: "bg-warning/10 border-warning/30",
      label: "Inspector",
      greeting: "Review pending milestones and submit geofenced attestations.",
    },
    auditor: {
      icon: Eye,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/25",
      label: "Auditor",
      greeting: "Verify payment clearance certificates and audit quorum results.",
    },
    citizen: {
      icon: Users,
      color: "text-accent",
      bg: "bg-accent/10 border-accent/25",
      label: "Citizen",
      greeting: "Participate in community attestations and file disputes.",
    },
  };

  const rc = roleConfig[role] ?? roleConfig["inspector"]!;
  const RoleIcon = rc.icon;

  return (
    <div className="space-y-6">
      {/* Role banner */}
      <div className={`flex items-center gap-4 rounded-xl border-2 p-4 ${rc.bg}`}>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm ${rc.color}`}>
          <RoleIcon className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">Welcome, {rc.label}</h2>
            <Badge variant="outline" className="text-xs capitalize">{role}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{rc.greeting}</p>
        </div>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
          {!isLive && (
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-amber-600 border-amber-200 bg-amber-50">
              Demo Data
            </Badge>
          )}
          {isLive && (
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-accent border-accent/20 bg-accent/5">
              Live
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time overview of transparency and accountability across
          Morocco&apos;s public infrastructure.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Projects"
          value={projectCount}
          icon={FolderKanban}
          trend="up"
          trendValue="+18%"
        />
        <MetricCard
          title="Attestations"
          value={attestationCount}
          icon={ClipboardCheck}
          trend="up"
          trendValue="+24%"
        />
        <MetricCard
          title="Certificates Issued"
          value={certificateCount}
          icon={FileCheck}
          trend="up"
          trendValue="+12%"
        />
        <MetricCard
          title="Open Disputes"
          value={disputeCount}
          icon={AlertTriangle}
          trend="down"
          trendValue="-40%"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project Health Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-accent" />
              Project Health Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={projectHealthData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="active" name="Active" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#2d8a4e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attestation Breakdown Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Attestation Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={attestationBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={2}
                  >
                    {attestationBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {attestationBreakdown.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-muted-foreground">{entry.name}</span>
                    <span className="font-semibold">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificate Timeline + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Certificate Issuance Trend */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCheck className="h-4 w-4 text-accent" />
              Certificate Issuance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={certificateIssuanceData}>
                <defs>
                  <linearGradient id="certGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2d8a4e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2d8a4e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="week" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#2d8a4e"
                  fill="url(#certGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-muted p-1.5">
                      <Icon className={`h-4 w-4 ${activity.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed">
                        {activity.description}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{activity.actor}</span>
                        <span>·</span>
                        <span>{activity.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" />
            Regional Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Region</th>
                  <th className="pb-3 font-medium text-center">Projects</th>
                  <th className="pb-3 font-medium text-right">Budget</th>
                </tr>
              </thead>
              <tbody>
                {regionCoverage.map((r) => (
                  <tr key={r.region} className="border-b last:border-0">
                    <td className="py-3 font-medium">{r.region}</td>
                    <td className="py-3 text-center">
                      <Badge variant="secondary">{r.projects}</Badge>
                    </td>
                    <td className="py-3 text-right font-mono text-muted-foreground">
                      {r.budget}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

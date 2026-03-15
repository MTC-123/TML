import { apiClient } from "../client";
import type { ApiResponse } from "../types";

// ---- Types ----------------------------------------------------------------

export interface ImpactMetric {
  label: string;
  value: number;
  suffix: string;
  trend: "up" | "down" | "stable";
  trendValue: string;
}

export interface MonthlyAttestationData {
  months: string[];
  values: number[];
}

export interface RoleBreakdown {
  label: string;
  value: number;
  color: string;
}

export interface RegionBreakdown {
  region: string;
  value: number;
}

export interface FundDisbursementData {
  months: string[];
  values: number[];
  total: number;
}

export interface ImpactDashboardData {
  metrics: ImpactMetric[];
  attestationsOverTime: MonthlyAttestationData;
  attestationsByRole: RoleBreakdown[];
  projectsByRegion: RegionBreakdown[];
  fundDisbursement: FundDisbursementData;
  recentActivity: Array<{
    type: "certificate" | "attestation";
    text: string;
    time: string;
  }>;
}

// ---- Endpoint functions ---------------------------------------------------

export async function getImpactDashboard(): Promise<ApiResponse<ImpactDashboardData>> {
  return apiClient<ApiResponse<ImpactDashboardData>>("/api/v1/dashboard/impact");
}

import { apiClient } from "../client";
import type { ApiResponse } from "../types";

// ---- Types ----------------------------------------------------------------

export interface DashboardStats {
  activeProjects: number;
  pendingAttestations: number;
  certificatesIssued: number;
  openDisputes: number;
}

export interface AdminStats {
  totalUsers: number;
  activeProjects: number;
  certificatesIssued: number;
  openDisputes: number;
}

export interface ContractorStats {
  myProjects: number;
  milestonesCompleted: number;
  pendingAttestation: number;
  openDisputes: number;
}

export interface AuditorStats {
  assigned: number;
  pendingReview: number;
  completed: number;
}

export interface CitizenStats {
  attestationsGiven: number;
  nearbyProjects: number;
}

export interface ActivityItem {
  id: string;
  type: "attestation" | "certificate" | "dispute" | "project" | "user";
  description: string;
  timestamp: string;
}

export interface PipelineStage {
  label: string;
  completed: number;
  total: number;
}

// ---- Endpoint functions ---------------------------------------------------

export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  return apiClient<ApiResponse<DashboardStats>>("/api/v1/dashboard/stats");
}

export async function getAdminStats(): Promise<ApiResponse<AdminStats>> {
  return apiClient<ApiResponse<AdminStats>>("/api/v1/dashboard/admin-stats");
}

export async function getContractorStats(): Promise<ApiResponse<ContractorStats>> {
  return apiClient<ApiResponse<ContractorStats>>("/api/v1/dashboard/contractor-stats");
}

export async function getAuditorStats(): Promise<ApiResponse<AuditorStats>> {
  return apiClient<ApiResponse<AuditorStats>>("/api/v1/dashboard/auditor-stats");
}

export async function getCitizenStats(): Promise<ApiResponse<CitizenStats>> {
  return apiClient<ApiResponse<CitizenStats>>("/api/v1/dashboard/citizen-stats");
}

export async function getRecentActivity(): Promise<ApiResponse<ActivityItem[]>> {
  return apiClient<ApiResponse<ActivityItem[]>>("/api/v1/dashboard/recent-activity");
}

export async function getAttestationPipeline(): Promise<ApiResponse<PipelineStage[]>> {
  return apiClient<ApiResponse<PipelineStage[]>>("/api/v1/dashboard/attestation-pipeline");
}

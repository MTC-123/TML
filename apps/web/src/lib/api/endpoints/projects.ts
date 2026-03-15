import { apiClient } from "../client";
import type { ApiResponse, ApiListResponse, PaginationParams } from "../types";
import {
  projectResponseSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ProjectResponse,
  type ProjectStatus,
} from "@tml/types";
import { z } from "zod";

// ---- Query params ---------------------------------------------------------

export interface ProjectListParams extends PaginationParams {
  status?: ProjectStatus;
  region?: string;
}

// ---- Dashboard response ---------------------------------------------------

export interface ProjectDashboard {
  project: ProjectResponse;
  milestoneCount: number;
  completedMilestones: number;
  pendingAttestations: number;
  certificatesIssued: number;
}

// ---- Endpoint functions ---------------------------------------------------

export async function createProject(
  input: CreateProjectInput,
): Promise<ApiResponse<ProjectResponse>> {
  const res = await apiClient<ApiResponse<ProjectResponse>>("/api/v1/projects", {
    method: "POST",
    body: input,
  });
  res.data = projectResponseSchema.parse(res.data);
  return res;
}

export async function listProjects(
  params?: ProjectListParams,
): Promise<ApiListResponse<ProjectResponse>> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.status) search.set("status", params.status);
  if (params?.region) search.set("region", params.region);

  const qs = search.toString();
  const res = await apiClient<ApiListResponse<ProjectResponse>>(
    `/api/v1/projects${qs ? `?${qs}` : ""}`,
  );
  res.data = z.array(projectResponseSchema).parse(res.data);
  return res;
}

export async function getProject(
  id: string,
): Promise<ApiResponse<ProjectResponse>> {
  const res = await apiClient<ApiResponse<ProjectResponse>>(
    `/api/v1/projects/${encodeURIComponent(id)}`,
  );
  res.data = projectResponseSchema.parse(res.data);
  return res;
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
): Promise<ApiResponse<ProjectResponse>> {
  const res = await apiClient<ApiResponse<ProjectResponse>>(
    `/api/v1/projects/${encodeURIComponent(id)}`,
    { method: "PATCH", body: input },
  );
  res.data = projectResponseSchema.parse(res.data);
  return res;
}

export async function getProjectDashboard(
  id: string,
): Promise<ApiResponse<ProjectDashboard>> {
  return apiClient<ApiResponse<ProjectDashboard>>(
    `/api/v1/projects/${encodeURIComponent(id)}/dashboard`,
  );
}

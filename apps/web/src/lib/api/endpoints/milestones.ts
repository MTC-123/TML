import { apiClient } from "../client";
import type { ApiResponse, ApiListResponse, PaginationParams } from "../types";
import {
  milestoneResponseSchema,
  type CreateMilestoneInput,
  type MilestoneResponse,
  type MilestoneStatus,
} from "@tml/types";
import { z } from "zod";

// ---- Request types --------------------------------------------------------

export type CreateMilestoneBody = Omit<CreateMilestoneInput, "projectId">;

export interface MilestoneStatusTransition {
  status: MilestoneStatus;
}

// ---- Endpoint functions ---------------------------------------------------

export async function createMilestone(
  projectId: string,
  input: CreateMilestoneBody,
): Promise<ApiResponse<MilestoneResponse>> {
  const res = await apiClient<ApiResponse<MilestoneResponse>>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/milestones`,
    { method: "POST", body: input },
  );
  res.data = milestoneResponseSchema.parse(res.data);
  return res;
}

export async function listMilestones(
  projectId: string,
  params?: PaginationParams,
): Promise<ApiListResponse<MilestoneResponse>> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  const res = await apiClient<ApiListResponse<MilestoneResponse>>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/milestones${qs ? `?${qs}` : ""}`,
  );
  res.data = z.array(milestoneResponseSchema).parse(res.data);
  return res;
}

export async function getMilestone(
  id: string,
): Promise<ApiResponse<MilestoneResponse>> {
  const res = await apiClient<ApiResponse<MilestoneResponse>>(
    `/api/v1/milestones/${encodeURIComponent(id)}`,
  );
  res.data = milestoneResponseSchema.parse(res.data);
  return res;
}

export async function transitionMilestoneStatus(
  id: string,
  input: MilestoneStatusTransition,
): Promise<ApiResponse<MilestoneResponse>> {
  const res = await apiClient<ApiResponse<MilestoneResponse>>(
    `/api/v1/milestones/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: input },
  );
  res.data = milestoneResponseSchema.parse(res.data);
  return res;
}

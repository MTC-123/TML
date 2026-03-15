import { apiClient } from "../client";
import type { ApiResponse, ApiListResponse, PaginationParams } from "../types";
import type {
  AuditorAssignment,
  UpdateAuditorAssignmentInput,
} from "@tml/types";

// ---- Request types --------------------------------------------------------

export interface SelectAuditorsInput {
  milestoneId: string;
  count?: number;
}

export interface AuditorAssignmentListParams extends PaginationParams {
  milestoneId?: string;
  status?: string;
}

// ---- Endpoint functions ---------------------------------------------------

export async function selectAuditors(
  input: SelectAuditorsInput,
): Promise<ApiResponse<AuditorAssignment[]>> {
  return apiClient<ApiResponse<AuditorAssignment[]>>(
    "/api/v1/auditor-assignments/select",
    { method: "POST", body: input },
  );
}

export async function listAuditorAssignments(
  params?: AuditorAssignmentListParams,
): Promise<ApiListResponse<AuditorAssignment>> {
  const search = new URLSearchParams();
  if (params?.milestoneId) search.set("milestoneId", params.milestoneId);
  if (params?.status) search.set("status", params.status);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  return apiClient<ApiListResponse<AuditorAssignment>>(
    `/api/v1/auditor-assignments${qs ? `?${qs}` : ""}`,
  );
}

export async function getAuditorAssignment(
  id: string,
): Promise<ApiResponse<AuditorAssignment>> {
  return apiClient<ApiResponse<AuditorAssignment>>(
    `/api/v1/auditor-assignments/${encodeURIComponent(id)}`,
  );
}

export async function updateAuditorAssignment(
  id: string,
  input: UpdateAuditorAssignmentInput,
): Promise<ApiResponse<AuditorAssignment>> {
  return apiClient<ApiResponse<AuditorAssignment>>(
    `/api/v1/auditor-assignments/${encodeURIComponent(id)}`,
    { method: "PATCH", body: input },
  );
}

export async function reassignAuditor(
  id: string,
): Promise<ApiResponse<AuditorAssignment>> {
  return apiClient<ApiResponse<AuditorAssignment>>(
    `/api/v1/auditor-assignments/${encodeURIComponent(id)}/reassign`,
    { method: "POST" },
  );
}

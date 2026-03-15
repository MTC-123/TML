import { apiClient } from "../client";
import type { ApiResponse, ApiListResponse, PaginationParams } from "../types";
import type {
  CitizenPool,
  CreateCitizenPoolInput,
  UpdateCitizenPoolInput,
} from "@tml/types";

// ---- Query params ---------------------------------------------------------

export interface CitizenPoolListParams extends PaginationParams {
  milestoneId: string;
}

// ---- Endpoint functions ---------------------------------------------------

export async function enrollCitizen(
  input: CreateCitizenPoolInput,
): Promise<ApiResponse<CitizenPool>> {
  return apiClient<ApiResponse<CitizenPool>>(
    "/api/v1/citizen-pools/enroll",
    { method: "POST", body: input },
  );
}

export async function listCitizenPools(
  params: CitizenPoolListParams,
): Promise<ApiListResponse<CitizenPool>> {
  const search = new URLSearchParams();
  search.set("milestoneId", params.milestoneId);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));

  return apiClient<ApiListResponse<CitizenPool>>(
    `/api/v1/citizen-pools?${search.toString()}`,
  );
}

export async function getCitizenPool(
  id: string,
): Promise<ApiResponse<CitizenPool>> {
  return apiClient<ApiResponse<CitizenPool>>(
    `/api/v1/citizen-pools/${encodeURIComponent(id)}`,
  );
}

export async function updateCitizenPool(
  id: string,
  input: UpdateCitizenPoolInput,
): Promise<ApiResponse<CitizenPool>> {
  return apiClient<ApiResponse<CitizenPool>>(
    `/api/v1/citizen-pools/${encodeURIComponent(id)}`,
    { method: "PATCH", body: input },
  );
}

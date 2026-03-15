import { apiClient } from "../client";
import type { ApiResponse, ApiListResponse, PaginationParams } from "../types";
import {
  disputeResponseSchema,
  type CreateDisputeInput,
  type ResolveDisputeInput,
  type DisputeResponse,
} from "@tml/types";
import { z } from "zod";

// ---- Query params ---------------------------------------------------------

export interface DisputeListParams extends PaginationParams {
  milestoneId?: string;
  status?: string;
}

// ---- Endpoint functions ---------------------------------------------------

export async function fileDispute(
  input: CreateDisputeInput,
): Promise<ApiResponse<DisputeResponse>> {
  const res = await apiClient<ApiResponse<DisputeResponse>>(
    "/api/v1/disputes",
    { method: "POST", body: input },
  );
  res.data = disputeResponseSchema.parse(res.data);
  return res;
}

export async function listDisputes(
  params?: DisputeListParams,
): Promise<ApiListResponse<DisputeResponse>> {
  const search = new URLSearchParams();
  if (params?.milestoneId) search.set("milestoneId", params.milestoneId);
  if (params?.status) search.set("status", params.status);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  const res = await apiClient<ApiListResponse<DisputeResponse>>(
    `/api/v1/disputes${qs ? `?${qs}` : ""}`,
  );
  res.data = z.array(disputeResponseSchema).parse(res.data);
  return res;
}

export async function getDispute(
  id: string,
): Promise<ApiResponse<DisputeResponse>> {
  const res = await apiClient<ApiResponse<DisputeResponse>>(
    `/api/v1/disputes/${encodeURIComponent(id)}`,
  );
  res.data = disputeResponseSchema.parse(res.data);
  return res;
}

export async function reviewDispute(
  id: string,
): Promise<ApiResponse<DisputeResponse>> {
  const res = await apiClient<ApiResponse<DisputeResponse>>(
    `/api/v1/disputes/${encodeURIComponent(id)}/review`,
    { method: "POST" },
  );
  res.data = disputeResponseSchema.parse(res.data);
  return res;
}

export async function resolveDispute(
  id: string,
  input: ResolveDisputeInput,
): Promise<ApiResponse<DisputeResponse>> {
  const res = await apiClient<ApiResponse<DisputeResponse>>(
    `/api/v1/disputes/${encodeURIComponent(id)}/resolve`,
    { method: "PATCH", body: input },
  );
  res.data = disputeResponseSchema.parse(res.data);
  return res;
}

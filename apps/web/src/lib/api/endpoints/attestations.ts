import { apiClient } from "../client";
import type { ApiResponse, ApiListResponse, PaginationParams } from "../types";
import {
  attestationResponseSchema,
  quorumBreakdownResponseSchema,
  type CreateAttestationInput,
  type CreateMilestoneAttestationBody,
  type AttestationResponse,
  type QuorumBreakdownResponse,
} from "@tml/types";
import { z } from "zod";

// ---- Query params ---------------------------------------------------------

export interface AttestationListParams extends PaginationParams {
  milestoneId: string;
}

// ---- Endpoint functions ---------------------------------------------------

export async function submitAttestation(
  input: CreateAttestationInput,
): Promise<ApiResponse<AttestationResponse>> {
  const res = await apiClient<ApiResponse<AttestationResponse>>(
    "/api/v1/attestations",
    { method: "POST", body: input },
  );
  res.data = attestationResponseSchema.parse(res.data);
  return res;
}

export async function listAttestations(
  params: AttestationListParams,
): Promise<ApiListResponse<AttestationResponse>> {
  const search = new URLSearchParams();
  search.set("milestoneId", params.milestoneId);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));

  const res = await apiClient<ApiListResponse<AttestationResponse>>(
    `/api/v1/attestations?${search.toString()}`,
  );
  res.data = z.array(attestationResponseSchema).parse(res.data);
  return res;
}

export async function getAttestation(
  id: string,
): Promise<ApiResponse<AttestationResponse>> {
  const res = await apiClient<ApiResponse<AttestationResponse>>(
    `/api/v1/attestations/${encodeURIComponent(id)}`,
  );
  res.data = attestationResponseSchema.parse(res.data);
  return res;
}

export async function verifyAttestation(
  id: string,
): Promise<ApiResponse<AttestationResponse>> {
  const res = await apiClient<ApiResponse<AttestationResponse>>(
    `/api/v1/attestations/${encodeURIComponent(id)}/verify`,
    { method: "POST" },
  );
  res.data = attestationResponseSchema.parse(res.data);
  return res;
}

export async function revokeAttestation(
  id: string,
): Promise<ApiResponse<AttestationResponse>> {
  const res = await apiClient<ApiResponse<AttestationResponse>>(
    `/api/v1/attestations/${encodeURIComponent(id)}/revoke`,
    { method: "POST" },
  );
  res.data = attestationResponseSchema.parse(res.data);
  return res;
}

// ---- Milestone-scoped attestation endpoints -------------------------------

export async function submitMilestoneAttestation(
  milestoneId: string,
  input: CreateMilestoneAttestationBody,
): Promise<ApiResponse<AttestationResponse>> {
  const res = await apiClient<ApiResponse<AttestationResponse>>(
    `/api/v1/milestones/${encodeURIComponent(milestoneId)}/attestations`,
    { method: "POST", body: input },
  );
  res.data = attestationResponseSchema.parse(res.data);
  return res;
}

export async function listMilestoneAttestations(
  milestoneId: string,
  params?: PaginationParams,
): Promise<ApiListResponse<AttestationResponse>> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  const res = await apiClient<ApiListResponse<AttestationResponse>>(
    `/api/v1/milestones/${encodeURIComponent(milestoneId)}/attestations${qs ? `?${qs}` : ""}`,
  );
  res.data = z.array(attestationResponseSchema).parse(res.data);
  return res;
}

export async function getQuorumStatus(
  milestoneId: string,
): Promise<ApiResponse<QuorumBreakdownResponse>> {
  const res = await apiClient<ApiResponse<QuorumBreakdownResponse>>(
    `/api/v1/milestones/${encodeURIComponent(milestoneId)}/quorum`,
  );
  res.data = quorumBreakdownResponseSchema.parse(res.data);
  return res;
}

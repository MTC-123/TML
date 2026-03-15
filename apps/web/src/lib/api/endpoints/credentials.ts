import { apiClient } from "../client";
import type { ApiResponse, ApiListResponse, PaginationParams } from "../types";

// ---- Credential types (frontend only) -------------------------------------

export interface CredentialResponse {
  id: string;
  credentialType: string;
  credentialHash: string;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  credentialJson?: Record<string, unknown>;
}

// ---- Query params ---------------------------------------------------------

export interface CredentialListParams extends PaginationParams {
  holderDid?: string;
  status?: string;
}

// ---- Endpoint functions ---------------------------------------------------

export async function listCredentials(
  params?: CredentialListParams,
): Promise<ApiListResponse<CredentialResponse>> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.holderDid) search.set("holderDid", params.holderDid);
  if (params?.status) search.set("status", params.status);

  const qs = search.toString();
  return apiClient<ApiListResponse<CredentialResponse>>(
    `/api/v1/credentials${qs ? `?${qs}` : ""}`,
  );
}

export async function getCredential(
  id: string,
): Promise<ApiResponse<CredentialResponse>> {
  return apiClient<ApiResponse<CredentialResponse>>(
    `/api/v1/credentials/${encodeURIComponent(id)}`,
  );
}

export async function listHolderCredentials(
  did: string,
  params?: PaginationParams,
): Promise<ApiListResponse<CredentialResponse>> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  return apiClient<ApiListResponse<CredentialResponse>>(
    `/api/v1/credentials/holder/${encodeURIComponent(did)}${qs ? `?${qs}` : ""}`,
  );
}

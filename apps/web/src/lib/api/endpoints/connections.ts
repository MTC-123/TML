import { apiClient } from "../client";
import type { ApiResponse, ApiListResponse, PaginationParams } from "../types";

// ---- Types ----------------------------------------------------------------

export interface AgentConnection {
  id: string;
  label: string;
  did: string;
  state: "invited" | "connected" | "active";
  createdAt: string;
}

export interface ConnectionInvitation {
  id: string;
  recipientDid: string;
  label: string;
  serviceEndpoint: string;
  expiresAt: string;
}

// ---- Endpoint functions ---------------------------------------------------

export async function listConnections(
  params?: PaginationParams,
): Promise<ApiListResponse<AgentConnection>> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  return apiClient<ApiListResponse<AgentConnection>>(
    `/api/v1/agent/connections${qs ? `?${qs}` : ""}`,
  );
}

export async function createConnectionInvitation(): Promise<ApiResponse<ConnectionInvitation>> {
  return apiClient<ApiResponse<ConnectionInvitation>>(
    "/api/v1/agent/connections/invite",
    { method: "POST" },
  );
}

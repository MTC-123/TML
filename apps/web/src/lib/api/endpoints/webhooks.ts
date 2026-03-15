import { apiClient } from "../client";
import type { ApiResponse, ApiListResponse, PaginationParams } from "../types";
import {
  webhookSubscriptionResponseSchema,
  type CreateWebhookSubscriptionInput,
  type WebhookSubscriptionResponse,
} from "@tml/types";
import { z } from "zod";

// ---- Update input ---------------------------------------------------------

export interface UpdateWebhookInput {
  url?: string;
  eventTypes?: string[];
  active?: boolean;
}

// ---- Endpoint functions ---------------------------------------------------

export async function createWebhook(
  input: CreateWebhookSubscriptionInput,
): Promise<ApiResponse<WebhookSubscriptionResponse>> {
  const res = await apiClient<ApiResponse<WebhookSubscriptionResponse>>(
    "/api/v1/webhooks",
    { method: "POST", body: input },
  );
  res.data = webhookSubscriptionResponseSchema.parse(res.data);
  return res;
}

export async function listWebhooks(
  params?: PaginationParams,
): Promise<ApiListResponse<WebhookSubscriptionResponse>> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  const res = await apiClient<ApiListResponse<WebhookSubscriptionResponse>>(
    `/api/v1/webhooks${qs ? `?${qs}` : ""}`,
  );
  res.data = z.array(webhookSubscriptionResponseSchema).parse(res.data);
  return res;
}

export async function getWebhook(
  id: string,
): Promise<ApiResponse<WebhookSubscriptionResponse>> {
  const res = await apiClient<ApiResponse<WebhookSubscriptionResponse>>(
    `/api/v1/webhooks/${encodeURIComponent(id)}`,
  );
  res.data = webhookSubscriptionResponseSchema.parse(res.data);
  return res;
}

export async function updateWebhook(
  id: string,
  input: UpdateWebhookInput,
): Promise<ApiResponse<WebhookSubscriptionResponse>> {
  const res = await apiClient<ApiResponse<WebhookSubscriptionResponse>>(
    `/api/v1/webhooks/${encodeURIComponent(id)}`,
    { method: "PATCH", body: input },
  );
  res.data = webhookSubscriptionResponseSchema.parse(res.data);
  return res;
}

export async function deleteWebhook(
  id: string,
): Promise<void> {
  await apiClient<void>(
    `/api/v1/webhooks/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

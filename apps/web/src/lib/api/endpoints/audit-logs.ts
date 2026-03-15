import { apiClient } from "../client";
import type { ApiListResponse } from "../types";
import {
  auditLogResponseSchema,
  type AuditLogResponse,
  type AuditLogQuery,
} from "@tml/types";
import { z } from "zod";

// ---- Endpoint functions ---------------------------------------------------

export async function listAuditLogs(
  params?: AuditLogQuery,
): Promise<ApiListResponse<AuditLogResponse>> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.entityType) search.set("entityType", params.entityType);
  if (params?.entityId) search.set("entityId", params.entityId);
  if (params?.actorDid) search.set("actorDid", params.actorDid);
  if (params?.action) search.set("action", params.action);
  if (params?.from) search.set("from", params.from.toISOString());
  if (params?.to) search.set("to", params.to.toISOString());

  const qs = search.toString();
  const res = await apiClient<ApiListResponse<AuditLogResponse>>(
    `/api/v1/audit-logs${qs ? `?${qs}` : ""}`,
  );
  res.data = z.array(auditLogResponseSchema).parse(res.data);
  return res;
}

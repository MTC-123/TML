import { apiClient } from "../client";
import type { ApiResponse, ApiListResponse, PaginationParams } from "../types";
import {
  complianceCertificateResponseSchema,
  type ComplianceCertificateResponse,
  type RevokeCertificateInput,
  type CertificateStatus,
} from "@tml/types";
import { z } from "zod";
import { getEnv } from "@/lib/config";
import { API_BASE_PATH } from "@/lib/constants";

// ---- Query params ---------------------------------------------------------

export interface CertificateListParams extends PaginationParams {
  status?: CertificateStatus;
}

// ---- TGR status update ----------------------------------------------------

export interface TgrStatusUpdate {
  status: CertificateStatus;
  tgrReference?: string;
}

// ---- Endpoint functions ---------------------------------------------------

export async function listCertificates(
  params?: CertificateListParams,
): Promise<ApiListResponse<ComplianceCertificateResponse>> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.status) search.set("status", params.status);

  const qs = search.toString();
  const res = await apiClient<ApiListResponse<ComplianceCertificateResponse>>(
    `/api/v1/certificates${qs ? `?${qs}` : ""}`,
  );
  res.data = z.array(complianceCertificateResponseSchema).parse(res.data);
  return res;
}

export async function getCertificate(
  id: string,
): Promise<ApiResponse<ComplianceCertificateResponse>> {
  const res = await apiClient<ApiResponse<ComplianceCertificateResponse>>(
    `/api/v1/certificates/${encodeURIComponent(id)}`,
  );
  res.data = complianceCertificateResponseSchema.parse(res.data);
  return res;
}

export async function verifyCertificateByHash(
  hash: string,
): Promise<ApiResponse<ComplianceCertificateResponse>> {
  const res = await apiClient<ApiResponse<ComplianceCertificateResponse>>(
    `/api/v1/certificates/verify/${encodeURIComponent(hash)}`,
  );
  res.data = complianceCertificateResponseSchema.parse(res.data);
  return res;
}

export async function revokeCertificate(
  id: string,
  input: RevokeCertificateInput,
): Promise<ApiResponse<ComplianceCertificateResponse>> {
  const res = await apiClient<ApiResponse<ComplianceCertificateResponse>>(
    `/api/v1/certificates/${encodeURIComponent(id)}/revoke`,
    { method: "POST", body: input },
  );
  res.data = complianceCertificateResponseSchema.parse(res.data);
  return res;
}

export async function updateTgrStatus(
  id: string,
  input: TgrStatusUpdate,
): Promise<ApiResponse<ComplianceCertificateResponse>> {
  const res = await apiClient<ApiResponse<ComplianceCertificateResponse>>(
    `/api/v1/certificates/${encodeURIComponent(id)}/tgr-status`,
    { method: "PATCH", body: input },
  );
  res.data = complianceCertificateResponseSchema.parse(res.data);
  return res;
}

// ---- PDF download ---------------------------------------------------------

export async function downloadCertificatePdf(id: string): Promise<Blob> {
  const env = getEnv();
  const url = `${env.NEXT_PUBLIC_API_URL}${API_BASE_PATH}/certificates/${encodeURIComponent(id)}/pdf`;

  // Retrieve access token from Zustand persisted auth store
  let accessToken: string | null = null;
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("tml-auth");
      if (stored) {
        const parsed = JSON.parse(stored) as { state?: { accessToken?: string } };
        accessToken = parsed.state?.accessToken ?? null;
      }
    } catch {
      // ignore parse errors
    }
  }

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error("Failed to download PDF");
  }

  return response.blob();
}

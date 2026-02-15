import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

/* ────────────────────────────────────────────────────────────── */
/*  Types (mirrors API response shapes)                           */
/* ────────────────────────────────────────────────────────────── */

export interface Project {
  id: string;
  name: string;
  region: string;
  budget: string;
  donor: string | null;
  status: string;
  boundary: unknown;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _milestoneCount?: number;
  _completedMilestones?: number;
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  sequenceOrder: number;
  budgetAllocation: string;
  status: string;
  geofence: unknown;
  quorumConfig: unknown;
  inspectorDeadline: string | null;
  auditorDeadline: string | null;
  citizenDeadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Attestation {
  id: string;
  milestoneId: string;
  actorId: string;
  type: string;
  status: string;
  evidenceHash: string | null;
  gpsLatitude: string | null;
  gpsLongitude: string | null;
  signature: string;
  metadata: unknown;
  createdAt: string;
  milestone?: { title: string };
  actor?: { did: string };
}

export interface Certificate {
  id: string;
  milestoneId: string;
  hash: string;
  status: string;
  issuedAt: string;
  revokedAt: string | null;
  metadata: unknown;
  milestone?: { title: string; project?: { name: string } };
}

export interface Dispute {
  id: string;
  milestoneId: string;
  raisedById: string;
  reason: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  milestone?: { title: string };
  raisedBy?: { did: string };
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: unknown;
  requestId: string | null;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
}

/* ────────────────────────────────────────────────────────────── */
/*  API availability check                                        */
/* ────────────────────────────────────────────────────────────── */

let apiAvailable: boolean | null = null;

async function checkApi(): Promise<boolean> {
  if (apiAvailable !== null) return apiAvailable;
  try {
    const res = await fetch(`${getApiUrl()}/api/v1/projects?limit=1`, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
    apiAvailable = res.ok || res.status === 401;
  } catch {
    apiAvailable = false;
  }
  // Re-check every 30s
  setTimeout(() => { apiAvailable = null; }, 30000);
  return apiAvailable;
}

function getApiUrl() {
  if (typeof window !== "undefined") {
    return (
      process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001"
    );
  }
  return "http://localhost:3001";
}

/* ────────────────────────────────────────────────────────────── */
/*  Projects                                                      */
/* ────────────────────────────────────────────────────────────── */

export function useProjects(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: async () => {
      const isUp = await checkApi();
      if (!isUp) return null; // signal to use fallback
      const qs = new URLSearchParams();
      if (params?.status && params.status !== "all") qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const path = `/api/v1/projects${qs.toString() ? `?${qs}` : ""}`;
      return api.get<PaginatedResponse<Project>>(path);
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => api.get<Project>(`/api/v1/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; region: string; budget: string; donor?: string; boundary?: unknown }) =>
      api.post<Project>("/api/v1/projects", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

/* ────────────────────────────────────────────────────────────── */
/*  Milestones                                                    */
/* ────────────────────────────────────────────────────────────── */

export function useMilestones(projectId: string) {
  return useQuery({
    queryKey: ["milestones", projectId],
    queryFn: () => api.get<PaginatedResponse<Milestone>>(`/api/v1/projects/${projectId}/milestones`),
    enabled: !!projectId,
  });
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { projectId: string; title: string; description?: string; budgetAllocation: string; geofence?: unknown }) =>
      api.post<Milestone>(`/api/v1/projects/${data.projectId}/milestones`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["milestones", vars.projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

/* ────────────────────────────────────────────────────────────── */
/*  Attestations                                                  */
/* ────────────────────────────────────────────────────────────── */

export function useAttestations(params?: { milestoneId?: string; page?: number }) {
  return useQuery({
    queryKey: ["attestations", params],
    queryFn: async () => {
      const isUp = await checkApi();
      if (!isUp) return null;
      const qs = new URLSearchParams();
      if (params?.milestoneId) qs.set("milestoneId", params.milestoneId);
      if (params?.page) qs.set("page", String(params.page));
      const path = `/api/v1/attestations${qs.toString() ? `?${qs}` : ""}`;
      return api.get<PaginatedResponse<Attestation>>(path);
    },
  });
}

export function useCreateAttestation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      milestoneId: string;
      type: string;
      gpsLatitude?: string;
      gpsLongitude?: string;
      evidenceHash?: string;
      signature: string;
      metadata?: unknown;
    }) => api.post<Attestation>("/api/v1/attestations", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attestations"] }),
  });
}

/* ────────────────────────────────────────────────────────────── */
/*  Certificates                                                  */
/* ────────────────────────────────────────────────────────────── */

export function useCertificates(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ["certificates", params],
    queryFn: async () => {
      const isUp = await checkApi();
      if (!isUp) return null;
      const qs = new URLSearchParams();
      if (params?.status && params.status !== "all") qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      const path = `/api/v1/certificates${qs.toString() ? `?${qs}` : ""}`;
      return api.get<PaginatedResponse<Certificate>>(path);
    },
  });
}

export function useVerifyCertificate(hash: string) {
  return useQuery({
    queryKey: ["certificate-verify", hash],
    queryFn: () => api.get<Certificate>(`/api/v1/certificates/verify/${hash}`),
    enabled: !!hash,
  });
}

/* ────────────────────────────────────────────────────────────── */
/*  Disputes                                                      */
/* ────────────────────────────────────────────────────────────── */

export function useDisputes(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ["disputes", params],
    queryFn: async () => {
      const isUp = await checkApi();
      if (!isUp) return null;
      const qs = new URLSearchParams();
      if (params?.status && params.status !== "all") qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      const path = `/api/v1/disputes${qs.toString() ? `?${qs}` : ""}`;
      return api.get<PaginatedResponse<Dispute>>(path);
    },
  });
}

export function useCreateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { milestoneId: string; reason: string }) =>
      api.post<Dispute>("/api/v1/disputes", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disputes"] }),
  });
}

/* ────────────────────────────────────────────────────────────── */
/*  Audit Logs                                                    */
/* ────────────────────────────────────────────────────────────── */

export function useAuditLogs(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: async () => {
      const isUp = await checkApi();
      if (!isUp) return null;
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      return api.get<PaginatedResponse<AuditLog>>(`/api/v1/audit-logs?${qs}`);
    },
  });
}

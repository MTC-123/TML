import type { z } from "zod";

// ---- Generic API response wrappers ----------------------------------------

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// ---- Query helpers --------------------------------------------------------

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ---- Utility: infer Zod type shorthand ------------------------------------

export type Infer<S extends z.ZodTypeAny> = z.infer<S>;

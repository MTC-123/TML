import type { AppErrorCode } from "@tml/types";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: AppErrorCode | "NETWORK_ERROR" | "UNKNOWN_ERROR";
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    code: AppErrorCode | "NETWORK_ERROR" | "UNKNOWN_ERROR",
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  get isForbidden(): boolean {
    return this.statusCode === 403;
  }

  get isValidation(): boolean {
    return this.statusCode === 400;
  }

  get isConflict(): boolean {
    return this.statusCode === 409;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

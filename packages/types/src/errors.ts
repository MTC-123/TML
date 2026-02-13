export type AppErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "CONFLICT"
  | "QUORUM_NOT_MET";

export interface AppError {
  readonly code: AppErrorCode;
  readonly message: string;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;
}

abstract class BaseError extends Error implements AppError {
  abstract readonly code: AppErrorCode;
  abstract readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }
}

export class NotFoundError extends BaseError {
  readonly code = "NOT_FOUND" as const;
  readonly statusCode = 404;

  constructor(entity: string, id: string) {
    super(`${entity} with id '${id}' not found`, { entity, id });
  }
}

export class ValidationError extends BaseError {
  readonly code = "VALIDATION_ERROR" as const;
  readonly statusCode = 400;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class AuthorizationError extends BaseError {
  readonly code = "AUTHORIZATION_ERROR" as const;
  readonly statusCode = 403;

  constructor(message = "Insufficient permissions") {
    super(message);
  }
}

export class ConflictError extends BaseError {
  readonly code = "CONFLICT" as const;
  readonly statusCode = 409;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class QuorumNotMetError extends BaseError {
  readonly code = "QUORUM_NOT_MET" as const;
  readonly statusCode = 422;

  constructor(
    required: number,
    current: number,
    role: string,
  ) {
    super(
      `Quorum not met for ${role}: ${current}/${required} attestations`,
      { required, current, role },
    );
  }
}

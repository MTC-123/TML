import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import { NotFoundError, ConflictError, ValidationError } from '@tml/types';
import type { AuditLogService } from './audit-log.service.js';

/**
 * Base service class providing shared error-handling helpers and audit logging.
 *
 * Domain services extend this to inherit:
 * - Result<T, E> wrapping utilities
 * - Consistent entity-not-found checks
 * - Automatic audit logging for mutations
 */
export abstract class BaseService {
  constructor(protected readonly auditLog: AuditLogService) {}

  // ── Result helpers ─────────────────────────────────────────────────────

  protected ok<T>(value: T): Result<T, never> {
    return ok(value);
  }

  protected err<E extends Error>(error: E): Result<never, E> {
    return err(error);
  }

  // ── Common guards ──────────────────────────────────────────────────────

  /**
   * Return an entity or a NotFoundError result.
   */
  protected ensureFound<T>(
    entity: T | null | undefined,
    entityName: string,
    id: string,
  ): Result<T, NotFoundError> {
    if (!entity) {
      return err(new NotFoundError(entityName, id));
    }
    return ok(entity);
  }

  /**
   * Guard against duplicate / conflicting state.
   */
  protected conflict(message: string, details?: Record<string, unknown>): Result<never, ConflictError> {
    return err(new ConflictError(message, details));
  }

  /**
   * Guard against invalid input that passed Zod but fails domain rules.
   */
  protected invalid(message: string, details?: Record<string, unknown>): Result<never, ValidationError> {
    return err(new ValidationError(message, details));
  }

  // ── Audit logging ──────────────────────────────────────────────────────

  /**
   * Log an auditable mutation. Swallows errors so audit failures never
   * break the primary operation.
   */
  protected async audit(params: {
    entityType: string;
    entityId: string;
    action: 'create' | 'update' | 'delete' | 'revoke' | 'submit' | 'approve' | 'reject' | 'assign';
    actorDid: string;
    payload: unknown;
  }): Promise<void> {
    try {
      await this.auditLog.log(params);
    } catch {
      // Audit failure must not break the primary operation.
    }
  }
}

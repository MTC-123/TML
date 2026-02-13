import { sha256Hex } from '@tml/crypto';
import type { AuditAction, AuditLog, AuditLogQuery } from '@tml/types';
import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import type { AuditLogsRepository } from '../repositories/audit-logs.repository.js';

export class AuditLogService {
  constructor(private repo: AuditLogsRepository) {}

  async log(params: {
    entityType: string;
    entityId: string;
    action: AuditAction;
    actorDid: string;
    payload: unknown;
  }): Promise<void> {
    const payloadHash = sha256Hex(JSON.stringify(params.payload));
    await this.repo.create({
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actorDid: params.actorDid,
      payloadHash,
    });
  }

  async query(
    params: AuditLogQuery,
  ): Promise<Result<{ data: AuditLog[]; total: number }>> {
    try {
      const result = await this.repo.query({
        entityType: params.entityType,
        entityId: params.entityId,
        actorDid: params.actorDid,
        action: params.action,
        from: params.from,
        to: params.to,
        page: params.page,
        limit: params.limit,
      });
      return ok(result);
    } catch (error) {
      return err(
        error instanceof Error ? error : new Error('Failed to query audit logs'),
      );
    }
  }
}

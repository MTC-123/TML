import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import type { WebhookSubscription } from '@tml/types';
import { NotFoundError } from '@tml/types';
import { sha256Hex } from '@tml/crypto';
import type { WebhooksRepository } from '../repositories/webhooks.repository.js';
import type { AuditLogService } from './audit-log.service.js';

export class WebhooksService {
  constructor(
    private repo: WebhooksRepository,
    private auditLog: AuditLogService,
  ) {}

  async create(
    data: { url: string; eventTypes: string[]; secret: string; subscriberName: string },
    actorDid: string,
  ): Promise<Result<WebhookSubscription>> {
    // Hash the secret before storage
    const secretHash = sha256Hex(data.secret);

    const webhook = await this.repo.create({
      url: data.url,
      eventTypes: data.eventTypes as Parameters<typeof this.repo.create>[0]['eventTypes'],
      secretHash,
      subscriberName: data.subscriberName,
    });

    await this.auditLog.log({
      entityType: 'WebhookSubscription',
      entityId: webhook.id,
      action: 'create',
      actorDid,
      payload: { url: data.url, eventTypes: data.eventTypes, subscriberName: data.subscriberName },
    });

    return ok(webhook);
  }

  async list(params: {
    page: number;
    limit: number;
  }): Promise<Result<{ data: WebhookSubscription[]; pagination: { page: number; limit: number; total: number } }>> {
    const { data, total } = await this.repo.findAll(params);
    return ok({ data, pagination: { page: params.page, limit: params.limit, total } });
  }

  async getById(id: string): Promise<Result<WebhookSubscription>> {
    const webhook = await this.repo.findById(id);
    if (!webhook || webhook.deletedAt) {
      return err(new NotFoundError('WebhookSubscription', id));
    }
    return ok(webhook);
  }

  async update(
    id: string,
    data: { url?: string; eventTypes?: string[]; active?: boolean },
    actorDid: string,
  ): Promise<Result<WebhookSubscription>> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.deletedAt) {
      return err(new NotFoundError('WebhookSubscription', id));
    }

    const webhook = await this.repo.update(id, data as Parameters<typeof this.repo.update>[1]);

    await this.auditLog.log({
      entityType: 'WebhookSubscription',
      entityId: id,
      action: 'update',
      actorDid,
      payload: data,
    });

    return ok(webhook);
  }

  async remove(id: string, actorDid: string): Promise<Result<void>> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.deletedAt) {
      return err(new NotFoundError('WebhookSubscription', id));
    }

    await this.repo.softDelete(id);

    await this.auditLog.log({
      entityType: 'WebhookSubscription',
      entityId: id,
      action: 'delete',
      actorDid,
      payload: {},
    });

    return ok(undefined);
  }
}

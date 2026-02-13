import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  createWebhookSubscriptionSchema,
  paginationSchema,
  webhookEventTypeSchema,
} from '@tml/types';
import { WebhooksService } from '../services/webhooks.service.js';
import { WebhooksRepository } from '../repositories/webhooks.repository.js';
import { AuditLogService } from '../services/audit-log.service.js';
import { AuditLogsRepository } from '../repositories/audit-logs.repository.js';

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

const updateWebhookBodySchema = z.object({
  url: z.string().url().optional(),
  eventTypes: z.array(webhookEventTypeSchema).min(1).optional(),
  active: z.boolean().optional(),
});

export class WebhooksController {
  private service: WebhooksService;

  constructor(fastify: FastifyInstance) {
    const repo = new WebhooksRepository(fastify.prisma);
    const auditLogsRepo = new AuditLogsRepository(fastify.prisma);
    const auditLog = new AuditLogService(auditLogsRepo);

    this.service = new WebhooksService(repo, auditLog);
  }

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as z.infer<typeof createWebhookSubscriptionSchema>;
    const result = await this.service.create(body, request.actor.did);

    if (!result.ok) {
      throw result.error;
    }

    reply.code(201).send({ data: result.value });
  }

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = request.query as z.infer<typeof paginationSchema>;
    const result = await this.service.list(query);

    if (!result.ok) {
      throw result.error;
    }

    reply.send(result.value);
  }

  async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof idParamsSchema>;
    const result = await this.service.getById(params.id);

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof idParamsSchema>;
    const body = request.body as z.infer<typeof updateWebhookBodySchema>;
    const result = await this.service.update(params.id, body, request.actor.did);

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }

  async remove(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof idParamsSchema>;
    const result = await this.service.remove(params.id, request.actor.did);

    if (!result.ok) {
      throw result.error;
    }

    reply.code(204).send();
  }
}

export { idParamsSchema, updateWebhookBodySchema };

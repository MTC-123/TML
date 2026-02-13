import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createDisputeSchema, resolveDisputeSchema } from '@tml/types';
import { DisputesService } from '../services/disputes.service.js';
import { DisputesRepository } from '../repositories/disputes.repository.js';
import { MilestonesRepository } from '../repositories/milestones.repository.js';
import { AuditorAssignmentsRepository } from '../repositories/auditor-assignments.repository.js';
import { WebhookDispatcherService } from '../services/webhook-dispatcher.service.js';
import { WebhooksRepository } from '../repositories/webhooks.repository.js';
import { AuditLogService } from '../services/audit-log.service.js';
import { AuditLogsRepository } from '../repositories/audit-logs.repository.js';

const milestoneQuerySchema = z.object({
  milestoneId: z.string().uuid(),
});

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export class DisputesController {
  private service: DisputesService;

  constructor(fastify: FastifyInstance) {
    const repo = new DisputesRepository(fastify.prisma);
    const milestonesRepo = new MilestonesRepository(fastify.prisma);
    const auditorAssignmentsRepo = new AuditorAssignmentsRepository(fastify.prisma);
    const webhooksRepo = new WebhooksRepository(fastify.prisma);
    const auditLogsRepo = new AuditLogsRepository(fastify.prisma);
    const auditLog = new AuditLogService(auditLogsRepo);
    const webhookDispatcher = new WebhookDispatcherService(webhooksRepo, auditLog);

    this.service = new DisputesService(
      repo,
      milestonesRepo,
      auditorAssignmentsRepo,
      webhookDispatcher,
      auditLog,
    );
  }

  async file(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as z.infer<typeof createDisputeSchema>;
    const result = await this.service.file(body, request.actor.did);

    if (!result.ok) {
      throw result.error;
    }

    reply.code(201).send({ data: result.value });
  }

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = request.query as z.infer<typeof milestoneQuerySchema>;
    const result = await this.service.list(query.milestoneId);

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }

  async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof idParamsSchema>;
    const result = await this.service.getById(params.id);

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }

  async review(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof idParamsSchema>;
    const result = await this.service.review(params.id, request.actor.did);

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }

  async resolve(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof idParamsSchema>;
    const body = request.body as z.infer<typeof resolveDisputeSchema>;
    const result = await this.service.resolve(params.id, body, request.actor.did);

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }
}

export { milestoneQuerySchema, idParamsSchema };

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AuditorAssignmentsService } from '../services/auditor-assignments.service.js';
import { AuditorAssignmentsRepository } from '../repositories/auditor-assignments.repository.js';
import { ActorsRepository } from '../repositories/actors.repository.js';
import { MilestonesRepository } from '../repositories/milestones.repository.js';
import { TrustedIssuersRepository } from '../repositories/trusted-issuers.repository.js';
import { AuditLogService } from '../services/audit-log.service.js';
import { AuditLogsRepository } from '../repositories/audit-logs.repository.js';

const assignForMilestoneBodySchema = z.object({
  count: z.number().int().min(1).max(50),
});

const selectBodySchema = z.object({
  milestoneId: z.string().uuid(),
  count: z.number().int().min(1).max(50),
});

const milestoneQuerySchema = z.object({
  milestoneId: z.string().uuid(),
});

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

const updateBodySchema = z.object({
  status: z.enum(['assigned', 'accepted', 'completed', 'recused', 'replaced']).optional(),
  conflictDeclared: z.boolean().optional(),
  conflictReason: z.string().max(1000).optional(),
});

export class AuditorAssignmentsController {
  private service: AuditorAssignmentsService;

  constructor(fastify: FastifyInstance) {
    const repo = new AuditorAssignmentsRepository(fastify.prisma);
    const actorsRepo = new ActorsRepository(fastify.prisma);
    const milestonesRepo = new MilestonesRepository(fastify.prisma);
    const trustedIssuersRepo = new TrustedIssuersRepository(fastify.prisma);
    const auditLogsRepo = new AuditLogsRepository(fastify.prisma);
    const auditLog = new AuditLogService(auditLogsRepo);

    this.service = new AuditorAssignmentsService(
      repo,
      actorsRepo,
      milestonesRepo,
      auditLog,
      trustedIssuersRepo,
    );
  }

  async select(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as z.infer<typeof selectBodySchema>;
    const result = await this.service.select(
      body.milestoneId,
      body.count,
      request.actor.did,
    );

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

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof idParamsSchema>;
    const body = request.body as z.infer<typeof updateBodySchema>;
    const result = await this.service.update(params.id, body, request.actor.did);

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }

  async reassign(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof idParamsSchema>;
    const result = await this.service.reassign(params.id, request.actor.did);

    if (!result.ok) {
      throw result.error;
    }

    reply.code(201).send({ data: result.value });
  }

  async assignForMilestone(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof idParamsSchema>;
    const body = request.body as z.infer<typeof assignForMilestoneBodySchema>;
    const result = await this.service.select(
      params.id,
      body.count,
      request.actor.did,
    );

    if (!result.ok) {
      throw result.error;
    }

    reply.code(201).send({ data: result.value });
  }

  async revokeForFraud(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof idParamsSchema>;
    const body = request.body as { reason: string };
    const result = await this.service.revokeForFraud(params.id, body.reason, request.actor.did);

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: { success: true } });
  }
}

export { assignForMilestoneBodySchema, selectBodySchema, milestoneQuerySchema, idParamsSchema, updateBodySchema };

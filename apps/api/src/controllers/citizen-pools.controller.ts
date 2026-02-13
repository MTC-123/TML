import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createCitizenPoolSchema, updateCitizenPoolSchema } from '@tml/types';
import { CitizenPoolsService } from '../services/citizen-pools.service.js';
import { CitizenPoolsRepository } from '../repositories/citizen-pools.repository.js';
import { ActorsRepository } from '../repositories/actors.repository.js';
import { MilestonesRepository } from '../repositories/milestones.repository.js';
import { ProjectsRepository } from '../repositories/projects.repository.js';
import { AuditLogService } from '../services/audit-log.service.js';
import { AuditLogsRepository } from '../repositories/audit-logs.repository.js';

const selectForMilestoneBodySchema = z.object({
  count: z.number().int().min(1).max(200),
});

const milestoneQuerySchema = z.object({
  milestoneId: z.string().uuid(),
});

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export class CitizenPoolsController {
  private service: CitizenPoolsService;

  constructor(fastify: FastifyInstance) {
    const repo = new CitizenPoolsRepository(fastify.prisma);
    const actorsRepo = new ActorsRepository(fastify.prisma);
    const milestonesRepo = new MilestonesRepository(fastify.prisma);
    const projectsRepo = new ProjectsRepository(fastify.prisma);
    const auditLogsRepo = new AuditLogsRepository(fastify.prisma);
    const auditLog = new AuditLogService(auditLogsRepo);

    this.service = new CitizenPoolsService(repo, actorsRepo, auditLog, milestonesRepo, projectsRepo);
  }

  async enroll(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as z.infer<typeof createCitizenPoolSchema>;
    const result = await this.service.enroll(body, request.actor.did);

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
    const body = request.body as z.infer<typeof updateCitizenPoolSchema>;
    const result = await this.service.update(params.id, body, request.actor.did);

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }

  async selectForMilestone(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof idParamsSchema>;
    const body = request.body as z.infer<typeof selectForMilestoneBodySchema>;
    const result = await this.service.selectPool(
      params.id,
      body.count,
      request.actor.did,
    );

    if (!result.ok) {
      throw result.error;
    }

    reply.code(201).send({ data: result.value });
  }
}

export { selectForMilestoneBodySchema, milestoneQuerySchema, idParamsSchema };

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { CreateMilestoneInput, UpdateMilestoneInput, MilestoneStatus } from '@tml/types';
import { MilestonesRepository } from '../repositories/milestones.repository.js';
import { AttestationsRepository } from '../repositories/attestations.repository.js';
import { AuditLogsRepository } from '../repositories/audit-logs.repository.js';
import { AuditLogService } from '../services/audit-log.service.js';
import { MilestonesService } from '../services/milestones.service.js';

export class MilestonesController {
  private service: MilestonesService;

  constructor(fastify: FastifyInstance) {
    const milestonesRepo = new MilestonesRepository(fastify.prisma);
    const attestationsRepo = new AttestationsRepository(fastify.prisma);
    const auditLogService = new AuditLogService(new AuditLogsRepository(fastify.prisma));
    this.service = new MilestonesService(milestonesRepo, attestationsRepo, auditLogService);
  }

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { projectId, page, limit } = request.query as { projectId: string; page: number; limit: number };
    const result = await this.service.list(projectId, { page, limit });
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const data = request.body as CreateMilestoneInput;
    const result = await this.service.create(data, request.actor.did);
    if (!result.ok) {
      throw result.error;
    }
    reply.status(201).send(result.value);
  }

  async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const result = await this.service.getById(id);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const data = request.body as UpdateMilestoneInput;
    const result = await this.service.update(id, data, request.actor.did);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async transition(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: MilestoneStatus };
    const result = await this.service.transition(id, status, request.actor.did);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async remove(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const result = await this.service.remove(id, request.actor.did);
    if (!result.ok) {
      throw result.error;
    }
    reply.status(204).send();
  }
}

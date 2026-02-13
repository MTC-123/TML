import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { MilestoneStatus } from '@tml/types';
import { MilestonesRepository } from '../repositories/milestones.repository.js';
import { ProjectsRepository } from '../repositories/projects.repository.js';
import { AuditLogsRepository } from '../repositories/audit-logs.repository.js';
import { AuditLogService } from '../services/audit-log.service.js';
import { MilestonesService } from '../services/milestones.service.js';

export class MilestonesController {
  private service: MilestonesService;

  constructor(fastify: FastifyInstance) {
    const milestonesRepo = new MilestonesRepository(fastify.prisma);
    const projectsRepo = new ProjectsRepository(fastify.prisma);
    const auditLogService = new AuditLogService(new AuditLogsRepository(fastify.prisma));
    this.service = new MilestonesService(milestonesRepo, projectsRepo, auditLogService);
  }

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const { page, limit } = request.query as { page: number; limit: number };
    const result = await this.service.list(id, { page, limit });
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const body = request.body as {
      sequenceNumber: number;
      description: string;
      deadline: Date;
      requiredInspectorCount: number;
      requiredAuditorCount: number;
      requiredCitizenCount: number;
    };
    const result = await this.service.create(id, body, request.actor.did);
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

  async transition(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: MilestoneStatus };
    const result = await this.service.transition(id, status, request.actor.did);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }
}

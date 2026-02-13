import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { CreateProjectInput, UpdateProjectInput } from '@tml/types';
import { ProjectsRepository } from '../repositories/projects.repository.js';
import { AuditLogsRepository } from '../repositories/audit-logs.repository.js';
import { AuditLogService } from '../services/audit-log.service.js';
import { ProjectsService } from '../services/projects.service.js';

export class ProjectsController {
  private service: ProjectsService;

  constructor(fastify: FastifyInstance) {
    const repo = new ProjectsRepository(fastify.prisma);
    const auditLogService = new AuditLogService(new AuditLogsRepository(fastify.prisma));
    this.service = new ProjectsService(repo, auditLogService);
  }

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = request.query as { page: number; limit: number; status?: string; region?: string };
    const result = await this.service.list(query);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const data = request.body as CreateProjectInput;
    const result = await this.service.create(data, request.actor.did);
    if (!result.ok) {
      throw result.error;
    }
    reply.status(201).send(result.value);
  }

  async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const result = await this.service.getByIdWithMilestones(id);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const data = request.body as UpdateProjectInput;
    const result = await this.service.update(id, data, request.actor.did);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async getDashboard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const result = await this.service.getDashboard(id);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }
}

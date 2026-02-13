import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { CertificateStatus, RevokeCertificateInput } from '@tml/types';
import { loadEnv } from '../config/env.js';
import { CertificatesRepository } from '../repositories/certificates.repository.js';
import { AttestationsRepository } from '../repositories/attestations.repository.js';
import { MilestonesRepository } from '../repositories/milestones.repository.js';
import { ProjectsRepository } from '../repositories/projects.repository.js';
import { ActorsRepository } from '../repositories/actors.repository.js';
import { AuditLogsRepository } from '../repositories/audit-logs.repository.js';
import { AuditLogService } from '../services/audit-log.service.js';
import { CertificatesService } from '../services/certificates.service.js';

export class CertificatesController {
  private service: CertificatesService;

  constructor(fastify: FastifyInstance) {
    const env = loadEnv();
    const certsRepo = new CertificatesRepository(fastify.prisma);
    const attestationsRepo = new AttestationsRepository(fastify.prisma);
    const milestonesRepo = new MilestonesRepository(fastify.prisma);
    const projectsRepo = new ProjectsRepository(fastify.prisma);
    const actorsRepo = new ActorsRepository(fastify.prisma);
    const auditLogService = new AuditLogService(new AuditLogsRepository(fastify.prisma));
    this.service = new CertificatesService(
      certsRepo,
      attestationsRepo,
      milestonesRepo,
      projectsRepo,
      actorsRepo,
      auditLogService,
      env,
    );
  }

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = request.query as { page: number; limit: number; status?: string };
    const result = await this.service.list(query);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const result = await this.service.getById(id);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async verifyByHash(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { hash } = request.params as { hash: string };
    const result = await this.service.verifyByHash(hash);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async revoke(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const { revocationReason } = request.body as RevokeCertificateInput;
    const result = await this.service.revoke(id, revocationReason, request.actor.did);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async updateTgrStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const { status, tgrReference } = request.body as { status: CertificateStatus; tgrReference?: string };
    const result = await this.service.updateTgrStatus(id, status, tgrReference ?? null, request.actor.did);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { CreateAttestationInput } from '@tml/types';
import { loadEnv } from '../config/env.js';
import { AttestationsRepository } from '../repositories/attestations.repository.js';
import { MilestonesRepository } from '../repositories/milestones.repository.js';
import { ActorsRepository } from '../repositories/actors.repository.js';
import { AuditorAssignmentsRepository } from '../repositories/auditor-assignments.repository.js';
import { CitizenPoolsRepository } from '../repositories/citizen-pools.repository.js';
import { CertificatesRepository } from '../repositories/certificates.repository.js';
import { ProjectsRepository } from '../repositories/projects.repository.js';
import { AuditLogsRepository } from '../repositories/audit-logs.repository.js';
import { AuditLogService } from '../services/audit-log.service.js';
import { CertificatesService } from '../services/certificates.service.js';
import { AttestationsService } from '../services/attestations.service.js';

// Simple no-op webhook dispatcher — the real one is implemented by domain-b-agent
const noopWebhookDispatcher = {
  async dispatch(_eventType: string, _payload: Record<string, unknown>): Promise<void> {
    // Webhook dispatching will be wired in when the webhook service is available
  },
};

export class AttestationsController {
  private service: AttestationsService;

  constructor(fastify: FastifyInstance) {
    const env = loadEnv();
    const attestationsRepo = new AttestationsRepository(fastify.prisma);
    const milestonesRepo = new MilestonesRepository(fastify.prisma);
    const actorsRepo = new ActorsRepository(fastify.prisma);
    const auditorAssignmentsRepo = new AuditorAssignmentsRepository(fastify.prisma);
    const citizenPoolsRepo = new CitizenPoolsRepository(fastify.prisma);
    const certsRepo = new CertificatesRepository(fastify.prisma);
    const projectsRepo = new ProjectsRepository(fastify.prisma);
    const auditLogService = new AuditLogService(new AuditLogsRepository(fastify.prisma));

    const certificatesService = new CertificatesService(
      certsRepo,
      attestationsRepo,
      milestonesRepo,
      projectsRepo,
      actorsRepo,
      auditLogService,
      env,
    );

    this.service = new AttestationsService(
      attestationsRepo,
      milestonesRepo,
      actorsRepo,
      auditorAssignmentsRepo,
      citizenPoolsRepo,
      certificatesService,
      noopWebhookDispatcher,
      auditLogService,
      projectsRepo,
    );
  }

  async submit(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const data = request.body as CreateAttestationInput;
    const result = await this.service.submit(data, request.actor.did);
    if (!result.ok) {
      throw result.error;
    }
    reply.status(201).send(result.value);
  }

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { milestoneId, page, limit } = request.query as { milestoneId: string; page: number; limit: number };
    const result = await this.service.list(milestoneId, { page, limit });
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

  async verify(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const result = await this.service.verify(id, request.actor.did);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async revoke(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const result = await this.service.revoke(id, request.actor.did);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async submitForMilestone(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id: milestoneId } = request.params as { id: string };
    const body = request.body as Omit<CreateAttestationInput, 'milestoneId'>;
    const data: CreateAttestationInput = { ...body, milestoneId };
    const result = await this.service.submit(data, request.actor.did);
    if (!result.ok) {
      throw result.error;
    }
    reply.status(201).send(result.value);
  }

  async listForMilestone(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id: milestoneId } = request.params as { id: string };
    const { page, limit } = request.query as { page: number; limit: number };
    const result = await this.service.list(milestoneId, { page, limit });
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async quorum(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id: milestoneId } = request.params as { id: string };
    const result = await this.service.checkQuorum(milestoneId);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }
}

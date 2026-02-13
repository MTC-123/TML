import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UssdService } from '../services/ussd.service.js';
import { ActorsRepository } from '../repositories/actors.repository.js';
import { MilestonesRepository } from '../repositories/milestones.repository.js';
import { AttestationsRepository } from '../repositories/attestations.repository.js';
import { AuditLogService } from '../services/audit-log.service.js';
import { AuditLogsRepository } from '../repositories/audit-logs.repository.js';

export const ussdCallbackSchema = z.object({
  sessionId: z.string(),
  serviceCode: z.string(),
  phoneNumber: z.string(),
  text: z.string(),
  networkCode: z.string().optional(),
});

export class UssdController {
  private service: UssdService;

  constructor(fastify: FastifyInstance) {
    const actorsRepo = new ActorsRepository(fastify.prisma);
    const milestonesRepo = new MilestonesRepository(fastify.prisma);
    const attestationsRepo = new AttestationsRepository(fastify.prisma);
    const auditLogsRepo = new AuditLogsRepository(fastify.prisma);
    const auditLog = new AuditLogService(auditLogsRepo);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ioredis type adapter
    this.service = new UssdService(
      fastify.redis as any,
      actorsRepo,
      milestonesRepo,
      attestationsRepo,
      auditLog,
    );
  }

  async callback(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as z.infer<typeof ussdCallbackSchema>;
    const result = await this.service.handleCallback(
      body.sessionId,
      body.serviceCode,
      body.phoneNumber,
      body.text,
    );

    if (!result.ok) {
      throw result.error;
    }

    reply.type('text/plain').send(result.value);
  }
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UssdService } from './ussd.service.js';
import { SessionStore, type RedisClient } from './session-store.js';
import { OtpManager } from './otp-manager.js';
import { ProjectCodeStore } from './project-code.js';
import { type SmsGateway, AfricasTalkingSmsGateway, MockSmsGateway } from './sms-gateway.js';
import { ActorsRepository } from '../../repositories/actors.repository.js';
import { MilestonesRepository } from '../../repositories/milestones.repository.js';
import { ProjectsRepository } from '../../repositories/projects.repository.js';
import { AttestationsRepository } from '../../repositories/attestations.repository.js';
import { AuditorAssignmentsRepository } from '../../repositories/auditor-assignments.repository.js';
import { CitizenPoolsRepository } from '../../repositories/citizen-pools.repository.js';
import { CertificatesRepository } from '../../repositories/certificates.repository.js';
import { WebhooksRepository } from '../../repositories/webhooks.repository.js';
import { AuditLogsRepository } from '../../repositories/audit-logs.repository.js';
import { AttestationsService } from '../../services/attestations.service.js';
import { CertificatesService } from '../../services/certificates.service.js';
import { WebhookDispatcherService } from '../../services/webhook-dispatcher.service.js';
import { AuditLogService } from '../../services/audit-log.service.js';
import { loadEnv } from '../../config.js';

export const ussdCallbackSchema = z.object({
  sessionId: z.string().min(1),
  serviceCode: z.string().min(1),
  phoneNumber: z.string().min(1),
  text: z.string(),
  networkCode: z.string().optional(),
});

export class UssdController {
  private service: UssdService;

  constructor(fastify: FastifyInstance, smsGateway?: SmsGateway) {
    const redis = fastify.redis as unknown as RedisClient;
    const env = loadEnv();

    // Repositories
    const actorsRepo = new ActorsRepository(fastify.prisma);
    const milestonesRepo = new MilestonesRepository(fastify.prisma);
    const projectsRepo = new ProjectsRepository(fastify.prisma);
    const attestationsRepo = new AttestationsRepository(fastify.prisma);
    const auditorAssignmentsRepo = new AuditorAssignmentsRepository(fastify.prisma);
    const citizenPoolsRepo = new CitizenPoolsRepository(fastify.prisma);
    const certificatesRepo = new CertificatesRepository(fastify.prisma);
    const webhooksRepo = new WebhooksRepository(fastify.prisma);
    const auditLogsRepo = new AuditLogsRepository(fastify.prisma);

    // Services
    const auditLog = new AuditLogService(auditLogsRepo);
    const certificatesService = new CertificatesService(
      certificatesRepo,
      attestationsRepo,
      milestonesRepo,
      projectsRepo,
      actorsRepo,
      auditLog,
      env,
    );
    const webhookDispatcher = new WebhookDispatcherService(webhooksRepo, auditLog);
    const attestationsService = new AttestationsService(
      attestationsRepo,
      milestonesRepo,
      actorsRepo,
      auditorAssignmentsRepo,
      citizenPoolsRepo,
      certificatesService,
      webhookDispatcher,
      auditLog,
      projectsRepo,
    );

    // USSD module components
    const sessionStore = new SessionStore(redis);
    const otpManager = new OtpManager(redis);
    const projectCodeStore = new ProjectCodeStore(redis);

    // SMS gateway
    const gateway: SmsGateway = smsGateway ??
      (env.AFRICASTALKING_API_KEY && env.AFRICASTALKING_USERNAME
        ? new AfricasTalkingSmsGateway(env.AFRICASTALKING_USERNAME, env.AFRICASTALKING_API_KEY)
        : new MockSmsGateway());

    this.service = new UssdService(
      redis,
      sessionStore,
      otpManager,
      projectCodeStore,
      gateway,
      actorsRepo,
      milestonesRepo,
      projectsRepo,
      attestationsService,
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

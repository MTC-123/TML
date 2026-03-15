import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ConsentPurpose } from '@tml/types';
import { ConsentRepository } from '../repositories/consent.repository.js';
import { ConsentService } from '../services/consent.service.js';

export class ConsentController {
  private service: ConsentService;

  constructor(fastify: FastifyInstance) {
    const consentRepo = new ConsentRepository(fastify.prisma);
    this.service = new ConsentService(consentRepo);
  }

  async grant(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as {
      purpose: ConsentPurpose;
      scope: string;
      legalBasis: string;
      ttlDays?: number;
    };

    const result = await this.service.grantConsent({
      actorId: request.actor.actorId,
      actorDid: request.actor.did,
      purpose: body.purpose,
      scope: body.scope,
      legalBasis: body.legalBasis,
      ttlDays: body.ttlDays,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? undefined,
    });

    if (!result.ok) {
      throw result.error;
    }
    reply.status(201).send(result.value);
  }

  async revoke(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as { purpose: ConsentPurpose };

    const result = await this.service.revokeConsent(
      request.actor.actorId,
      body.purpose,
    );

    if (!result.ok) {
      throw result.error;
    }
    reply.status(204).send();
  }

  async check(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { purpose } = request.params as { purpose: ConsentPurpose };

    const hasConsent = await this.service.checkConsent(
      request.actor.actorId,
      purpose,
    );

    reply.send({ purpose, granted: hasConsent });
  }

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await this.service.getConsents(request.actor.actorId);

    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }
}

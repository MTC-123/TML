import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { issueCredentialBodySchema, revokeCredentialBodySchema } from '@tml/types';
import { CredentialsService } from '../services/credentials.service.js';
import { IssuedCredentialsRepository } from '../repositories/issued-credentials.repository.js';
import { TrustedIssuersRepository } from '../repositories/trusted-issuers.repository.js';
import { loadEnv } from '../config.js';

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

const holderQuerySchema = z.object({
  holderDid: z.string().min(1),
});

export class CredentialsController {
  private service: CredentialsService;

  constructor(fastify: FastifyInstance) {
    const credentialsRepo = new IssuedCredentialsRepository(fastify.prisma);
    const trustedIssuersRepo = new TrustedIssuersRepository(fastify.prisma);
    const env = loadEnv();

    this.service = new CredentialsService(credentialsRepo, trustedIssuersRepo, env);
  }

  async issue(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as z.infer<typeof issueCredentialBodySchema>;
    const result = await this.service.issue({
      type: body.type as Parameters<typeof this.service.issue>[0]['type'],
      holderDid: body.holderDid,
      actorId: request.actor.actorId,
      metadata: (body.metadata ?? {}) as Record<string, unknown>,
    });

    if (!result.ok) {
      throw result.error;
    }

    reply.code(201).send({ data: result.value });
  }

  async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof idParamsSchema>;
    const result = await this.service.getById(params.id);

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }

  async getByHolder(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = request.query as z.infer<typeof holderQuerySchema>;
    const result = await this.service.getByHolder(query.holderDid);

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }

  async revoke(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof idParamsSchema>;
    const body = request.body as z.infer<typeof revokeCredentialBodySchema>;
    const result = await this.service.revoke(params.id, body.reason);

    if (!result.ok) {
      throw result.error;
    }

    reply.code(204).send();
  }

  async verify(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof idParamsSchema>;
    const result = await this.service.verify(params.id);

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }
}

export { idParamsSchema, holderQuerySchema };

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createTrustedIssuerSchema } from '@tml/types';
import { TrustedIssuersService } from '../services/trusted-issuers.service.js';
import { TrustedIssuersRepository } from '../repositories/trusted-issuers.repository.js';

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export class TrustedIssuersController {
  private service: TrustedIssuersService;

  constructor(fastify: FastifyInstance) {
    const repo = new TrustedIssuersRepository(fastify.prisma);
    this.service = new TrustedIssuersService(repo);
  }

  async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as z.infer<typeof createTrustedIssuerSchema>;
    const result = await this.service.register(body);

    if (!result.ok) {
      throw result.error;
    }

    reply.code(201).send({ data: result.value });
  }

  async list(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await this.service.list();

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }

  async remove(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof idParamsSchema>;
    const result = await this.service.remove(params.id);

    if (!result.ok) {
      throw result.error;
    }

    reply.code(204).send();
  }
}

export { idParamsSchema };

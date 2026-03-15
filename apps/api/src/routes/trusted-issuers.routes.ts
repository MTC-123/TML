import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { createTrustedIssuerSchema } from '@tml/types';
import {
  TrustedIssuersController,
  idParamsSchema,
} from '../controllers/trusted-issuers.controller.js';

export async function trustedIssuersRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const controller = new TrustedIssuersController(fastify);

  // POST / - Register a trusted issuer
  fastify.post(
    '/',
    {
      preHandler: [
        authenticate,
        requireRole('admin'),
        rateLimit('elevated'),
        validateBody(createTrustedIssuerSchema),
      ],
    },
    (request, reply) => controller.register(request, reply),
  );

  // GET / - List all trusted issuers
  fastify.get(
    '/',
    {
      preHandler: [
        authenticate,
        rateLimit('standard'),
      ],
    },
    (request, reply) => controller.list(request, reply),
  );

  // DELETE /:id - Remove a trusted issuer
  fastify.delete(
    '/:id',
    {
      preHandler: [
        authenticate,
        requireRole('admin'),
        rateLimit('elevated'),
        validateParams(idParamsSchema),
      ],
    },
    (request, reply) => controller.remove(request, reply),
  );
}

import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { issueCredentialBodySchema, revokeCredentialBodySchema } from '@tml/types';
import {
  CredentialsController,
  idParamsSchema,
  holderQuerySchema,
} from '../controllers/credentials.controller.js';

export async function credentialsRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const controller = new CredentialsController(fastify);

  // POST / - Issue a new credential
  fastify.post(
    '/',
    {
      preHandler: [
        authenticate,
        requireRole('admin'),
        rateLimit('elevated'),
        validateBody(issueCredentialBodySchema),
      ],
    },
    (request, reply) => controller.issue(request, reply),
  );

  // GET /holder - Get credentials by holder DID
  fastify.get(
    '/holder',
    {
      preHandler: [
        authenticate,
        rateLimit('standard'),
        validateQuery(holderQuerySchema),
      ],
    },
    (request, reply) => controller.getByHolder(request, reply),
  );

  // GET /:id - Get credential by ID
  fastify.get(
    '/:id',
    {
      preHandler: [
        authenticate,
        rateLimit('standard'),
        validateParams(idParamsSchema),
      ],
    },
    (request, reply) => controller.getById(request, reply),
  );

  // POST /:id/verify - Verify a credential
  fastify.post(
    '/:id/verify',
    {
      preHandler: [
        authenticate,
        rateLimit('standard'),
        validateParams(idParamsSchema),
      ],
    },
    (request, reply) => controller.verify(request, reply),
  );

  // POST /:id/revoke - Revoke a credential
  fastify.post(
    '/:id/revoke',
    {
      preHandler: [
        authenticate,
        requireRole('admin'),
        rateLimit('elevated'),
        validateParams(idParamsSchema),
        validateBody(revokeCredentialBodySchema),
      ],
    },
    (request, reply) => controller.revoke(request, reply),
  );
}

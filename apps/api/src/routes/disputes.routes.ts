import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { createDisputeSchema, resolveDisputeSchema } from '@tml/types';
import {
  DisputesController,
  milestoneQuerySchema,
  idParamsSchema,
} from '../controllers/disputes.controller.js';

export async function disputesRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const controller = new DisputesController(fastify);

  // POST / - File a dispute
  fastify.post(
    '/',
    {
      preHandler: [
        authenticate,
        rateLimit('elevated'),
        validateBody(createDisputeSchema),
      ],
    },
    (request, reply) => controller.file(request, reply),
  );

  // GET / - List disputes for a milestone
  fastify.get(
    '/',
    {
      preHandler: [
        authenticate,
        rateLimit('standard'),
        validateQuery(milestoneQuerySchema),
      ],
    },
    (request, reply) => controller.list(request, reply),
  );

  // GET /:id - Get dispute by ID
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

  // POST /:id/review - Move dispute to under_review
  fastify.post(
    '/:id/review',
    {
      preHandler: [
        authenticate,
        requireRole('admin'),
        rateLimit('elevated'),
        validateParams(idParamsSchema),
      ],
    },
    (request, reply) => controller.review(request, reply),
  );

  // PATCH /:id/resolve - Resolve a dispute
  fastify.patch(
    '/:id/resolve',
    {
      preHandler: [
        authenticate,
        requireRole('admin'),
        rateLimit('elevated'),
        validateParams(idParamsSchema),
        validateBody(resolveDisputeSchema),
      ],
    },
    (request, reply) => controller.resolve(request, reply),
  );
}

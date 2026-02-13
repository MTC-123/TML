import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { createCitizenPoolSchema, updateCitizenPoolSchema } from '@tml/types';
import {
  CitizenPoolsController,
  milestoneQuerySchema,
  idParamsSchema,
} from '../controllers/citizen-pools.controller.js';

export async function citizenPoolsRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const controller = new CitizenPoolsController(fastify);

  // POST /enroll - Enroll a citizen in a milestone pool
  fastify.post(
    '/enroll',
    {
      preHandler: [
        authenticate,
        requireRole('citizen', 'cso_aggregator'),
        rateLimit('elevated'),
        validateBody(createCitizenPoolSchema),
      ],
    },
    (request, reply) => controller.enroll(request, reply),
  );

  // GET / - List citizen pools for a milestone
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

  // GET /:id - Get citizen pool by ID
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

  // PATCH /:id - Update citizen pool status
  fastify.patch(
    '/:id',
    {
      preHandler: [
        authenticate,
        requireRole('admin', 'cso_aggregator'),
        rateLimit('elevated'),
        validateParams(idParamsSchema),
        validateBody(updateCitizenPoolSchema),
      ],
    },
    (request, reply) => controller.update(request, reply),
  );
}

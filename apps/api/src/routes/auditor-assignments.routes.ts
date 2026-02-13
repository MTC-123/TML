import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
  AuditorAssignmentsController,
  selectBodySchema,
  milestoneQuerySchema,
  idParamsSchema,
  updateBodySchema,
} from '../controllers/auditor-assignments.controller.js';

export async function auditorAssignmentsRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const controller = new AuditorAssignmentsController(fastify);

  // POST /select - Select auditors for a milestone
  fastify.post(
    '/select',
    {
      preHandler: [
        authenticate,
        requireRole('admin'),
        rateLimit('elevated'),
        validateBody(selectBodySchema),
      ],
    },
    (request, reply) => controller.select(request, reply),
  );

  // GET / - List assignments for a milestone
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

  // GET /:id - Get assignment by ID
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

  // PATCH /:id - Update assignment
  fastify.patch(
    '/:id',
    {
      preHandler: [
        authenticate,
        requireRole('independent_auditor', 'admin'),
        rateLimit('elevated'),
        validateParams(idParamsSchema),
        validateBody(updateBodySchema),
      ],
    },
    (request, reply) => controller.update(request, reply),
  );

  // POST /:id/reassign - Reassign a recused auditor
  fastify.post(
    '/:id/reassign',
    {
      preHandler: [
        authenticate,
        requireRole('admin'),
        rateLimit('elevated'),
        validateParams(idParamsSchema),
      ],
    },
    (request, reply) => controller.reassign(request, reply),
  );
}

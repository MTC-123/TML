import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
  createMilestoneSchema,
  updateMilestoneSchema,
  paginationSchema,
  uuidSchema,
  milestoneStatusSchema,
} from '@tml/types';
import { MilestonesController } from '../controllers/milestones.controller.js';

const milestoneListQuerySchema = paginationSchema.extend({
  projectId: uuidSchema,
});

const idParamsSchema = z.object({ id: uuidSchema });

const transitionBodySchema = z.object({
  status: milestoneStatusSchema,
});

export async function milestoneRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = new MilestonesController(fastify);

  // GET / — list milestones for a project
  fastify.get(
    '/',
    { preHandler: [authenticate, rateLimit('standard'), validateQuery(milestoneListQuerySchema)] },
    (req, reply) => controller.list(req, reply),
  );

  // POST / — create milestone (admin or contractor_engineer)
  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole('admin', 'contractor_engineer'), rateLimit('elevated'), validateBody(createMilestoneSchema)] },
    (req, reply) => controller.create(req, reply),
  );

  // GET /:id — get milestone by ID
  fastify.get(
    '/:id',
    { preHandler: [authenticate, rateLimit('standard'), validateParams(idParamsSchema)] },
    (req, reply) => controller.getById(req, reply),
  );

  // PATCH /:id — update milestone (admin or contractor_engineer)
  fastify.patch(
    '/:id',
    { preHandler: [authenticate, requireRole('admin', 'contractor_engineer'), rateLimit('elevated'), validateBody(updateMilestoneSchema), validateParams(idParamsSchema)] },
    (req, reply) => controller.update(req, reply),
  );

  // POST /:id/transition — transition milestone status (admin or contractor_engineer)
  fastify.post(
    '/:id/transition',
    { preHandler: [authenticate, requireRole('admin', 'contractor_engineer'), rateLimit('elevated'), validateBody(transitionBodySchema), validateParams(idParamsSchema)] },
    (req, reply) => controller.transition(req, reply),
  );

  // DELETE /:id — soft-delete milestone (admin only)
  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole('admin'), rateLimit('elevated'), validateParams(idParamsSchema)] },
    (req, reply) => controller.remove(req, reply),
  );
}

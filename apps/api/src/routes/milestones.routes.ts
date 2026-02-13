import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
  paginationSchema,
  uuidSchema,
  milestoneStatusSchema,
} from '@tml/types';
import { MilestonesController } from '../controllers/milestones.controller.js';

const idParamsSchema = z.object({ id: uuidSchema });

// Body schema for milestone creation (projectId comes from URL param)
const createMilestoneBodySchema = z.object({
  sequenceNumber: z.number().int().min(1),
  description: z.string().min(1).max(1000),
  deadline: z.coerce.date(),
  requiredInspectorCount: z.number().int().min(1).default(1),
  requiredAuditorCount: z.number().int().min(1).default(1),
  requiredCitizenCount: z.number().int().min(1).default(3),
});

const transitionBodySchema = z.object({
  status: milestoneStatusSchema,
});

/**
 * Nested routes: POST/GET under /api/v1/projects/:id/milestones
 * Registered at prefix /api/v1/projects/:id/milestones in app.ts
 */
export async function projectMilestoneRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = new MilestonesController(fastify);

  // POST / — create milestone (admin only)
  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole('admin'), rateLimit('elevated'), validateParams(idParamsSchema), validateBody(createMilestoneBodySchema)] },
    (req, reply) => controller.create(req, reply),
  );

  // GET / — list with attestation summary
  fastify.get(
    '/',
    { preHandler: [authenticate, rateLimit('standard'), validateParams(idParamsSchema), validateQuery(paginationSchema)] },
    (req, reply) => controller.list(req, reply),
  );
}

/**
 * Standalone routes: GET/PATCH under /api/v1/milestones/:id
 * Registered at prefix /api/v1/milestones in app.ts
 */
export async function milestoneRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = new MilestonesController(fastify);

  // GET /:id — detail with all attestations
  fastify.get(
    '/:id',
    { preHandler: [authenticate, rateLimit('standard'), validateParams(idParamsSchema)] },
    (req, reply) => controller.getById(req, reply),
  );

  // PATCH /:id/status — status transition (enforce valid state machine)
  fastify.patch(
    '/:id/status',
    { preHandler: [authenticate, requireRole('admin', 'contractor_engineer'), rateLimit('elevated'), validateParams(idParamsSchema), validateBody(transitionBodySchema)] },
    (req, reply) => controller.transition(req, reply),
  );
}

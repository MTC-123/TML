import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
  paginationSchema,
  uuidSchema,
  projectStatusSchema,
} from '@tml/types';
import { ProjectsController } from '../controllers/projects.controller.js';

const projectListQuerySchema = paginationSchema.extend({
  status: projectStatusSchema.optional(),
  region: z.string().optional(),
});

const idParamsSchema = z.object({ id: uuidSchema });

export async function projectRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = new ProjectsController(fastify);

  // POST / — create project (admin only, with geofence polygon)
  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole('admin'), rateLimit('elevated'), validateBody(createProjectSchema)] },
    (req, reply) => controller.create(req, reply),
  );

  // GET / — list with pagination, filter by status/region
  fastify.get(
    '/',
    { preHandler: [authenticate, rateLimit('standard'), validateQuery(projectListQuerySchema)] },
    (req, reply) => controller.list(req, reply),
  );

  // GET /:id — detail with milestones and attestation progress
  fastify.get(
    '/:id',
    { preHandler: [authenticate, rateLimit('standard'), validateParams(idParamsSchema)] },
    (req, reply) => controller.getById(req, reply),
  );

  // PATCH /:id — update (admin only)
  fastify.patch(
    '/:id',
    { preHandler: [authenticate, requireRole('admin'), rateLimit('elevated'), validateParams(idParamsSchema), validateBody(updateProjectSchema)] },
    (req, reply) => controller.update(req, reply),
  );

  // GET /:id/dashboard — aggregated stats
  fastify.get(
    '/:id/dashboard',
    { preHandler: [authenticate, rateLimit('standard'), validateParams(idParamsSchema)] },
    (req, reply) => controller.getDashboard(req, reply),
  );
}

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

  // GET / — list projects
  fastify.get(
    '/',
    { preHandler: [authenticate, rateLimit('standard'), validateQuery(projectListQuerySchema)] },
    (req, reply) => controller.list(req, reply),
  );

  // POST / — create project (admin only)
  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole('admin'), rateLimit('elevated'), validateBody(createProjectSchema)] },
    (req, reply) => controller.create(req, reply),
  );

  // GET /stats — project statistics (IMPORTANT: register before /:id)
  fastify.get(
    '/stats',
    { preHandler: [authenticate, rateLimit('standard')] },
    (req, reply) => controller.getStats(req, reply),
  );

  // GET /:id — get project by ID
  fastify.get(
    '/:id',
    { preHandler: [authenticate, rateLimit('standard'), validateParams(idParamsSchema)] },
    (req, reply) => controller.getById(req, reply),
  );

  // PATCH /:id — update project (admin only)
  fastify.patch(
    '/:id',
    { preHandler: [authenticate, requireRole('admin'), rateLimit('elevated'), validateBody(updateProjectSchema), validateParams(idParamsSchema)] },
    (req, reply) => controller.update(req, reply),
  );

  // DELETE /:id — soft-delete project (admin only)
  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole('admin'), rateLimit('elevated'), validateParams(idParamsSchema)] },
    (req, reply) => controller.remove(req, reply),
  );
}

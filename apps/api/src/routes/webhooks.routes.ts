import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { createWebhookSubscriptionSchema, paginationSchema } from '@tml/types';
import {
  WebhooksController,
  idParamsSchema,
  updateWebhookBodySchema,
} from '../controllers/webhooks.controller.js';

export async function webhooksRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const controller = new WebhooksController(fastify);

  // POST / - Create webhook subscription
  fastify.post(
    '/',
    {
      preHandler: [
        authenticate,
        requireRole('admin'),
        rateLimit('elevated'),
        validateBody(createWebhookSubscriptionSchema),
      ],
    },
    (request, reply) => controller.create(request, reply),
  );

  // GET / - List webhook subscriptions
  fastify.get(
    '/',
    {
      preHandler: [
        authenticate,
        requireRole('admin'),
        rateLimit('standard'),
        validateQuery(paginationSchema),
      ],
    },
    (request, reply) => controller.list(request, reply),
  );

  // GET /:id - Get webhook subscription by ID
  fastify.get(
    '/:id',
    {
      preHandler: [
        authenticate,
        requireRole('admin'),
        rateLimit('standard'),
        validateParams(idParamsSchema),
      ],
    },
    (request, reply) => controller.getById(request, reply),
  );

  // PATCH /:id - Update webhook subscription
  fastify.patch(
    '/:id',
    {
      preHandler: [
        authenticate,
        requireRole('admin'),
        rateLimit('elevated'),
        validateParams(idParamsSchema),
        validateBody(updateWebhookBodySchema),
      ],
    },
    (request, reply) => controller.update(request, reply),
  );

  // DELETE /:id - Delete webhook subscription
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

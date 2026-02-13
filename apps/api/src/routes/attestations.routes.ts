import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
  createAttestationSchema,
  paginationSchema,
  uuidSchema,
} from '@tml/types';
import { AttestationsController } from '../controllers/attestations.controller.js';

const attestationListQuerySchema = paginationSchema.extend({
  milestoneId: uuidSchema,
});

const idParamsSchema = z.object({ id: uuidSchema });

export async function attestationRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = new AttestationsController(fastify);

  // POST / — submit attestation (contractor_engineer, independent_auditor, or citizen)
  fastify.post(
    '/',
    {
      preHandler: [
        authenticate,
        requireRole('contractor_engineer', 'independent_auditor', 'citizen', 'admin'),
        rateLimit('elevated'),
        validateBody(createAttestationSchema),
      ],
    },
    (req, reply) => controller.submit(req, reply),
  );

  // GET / — list attestations for a milestone
  fastify.get(
    '/',
    { preHandler: [authenticate, rateLimit('standard'), validateQuery(attestationListQuerySchema)] },
    (req, reply) => controller.list(req, reply),
  );

  // GET /:id — get attestation by ID
  fastify.get(
    '/:id',
    { preHandler: [authenticate, rateLimit('standard'), validateParams(idParamsSchema)] },
    (req, reply) => controller.getById(req, reply),
  );

  // POST /:id/verify — verify attestation (admin only)
  fastify.post(
    '/:id/verify',
    { preHandler: [authenticate, requireRole('admin'), rateLimit('elevated'), validateParams(idParamsSchema)] },
    (req, reply) => controller.verify(req, reply),
  );

  // POST /:id/revoke — revoke attestation (admin only)
  fastify.post(
    '/:id/revoke',
    { preHandler: [authenticate, requireRole('admin'), rateLimit('elevated'), validateParams(idParamsSchema)] },
    (req, reply) => controller.revoke(req, reply),
  );
}

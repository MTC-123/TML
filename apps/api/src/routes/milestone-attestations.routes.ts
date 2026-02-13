import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
  createMilestoneAttestationBodySchema,
  paginationSchema,
  uuidSchema,
} from '@tml/types';
import { AttestationsController } from '../controllers/attestations.controller.js';

const idParamsSchema = z.object({ id: uuidSchema });

export async function milestoneAttestationRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = new AttestationsController(fastify);

  // POST /:id/attestations — submit attestation for milestone
  fastify.post(
    '/:id/attestations',
    {
      preHandler: [
        authenticate,
        requireRole('contractor_engineer', 'independent_auditor', 'citizen', 'admin'),
        rateLimit('elevated'),
        validateParams(idParamsSchema),
        validateBody(createMilestoneAttestationBodySchema),
      ],
    },
    (req, reply) => controller.submitForMilestone(req, reply),
  );

  // GET /:id/attestations — list attestations for milestone
  fastify.get(
    '/:id/attestations',
    {
      preHandler: [
        authenticate,
        rateLimit('standard'),
        validateParams(idParamsSchema),
        validateQuery(paginationSchema),
      ],
    },
    (req, reply) => controller.listForMilestone(req, reply),
  );

  // GET /:id/quorum — current quorum breakdown
  fastify.get(
    '/:id/quorum',
    {
      preHandler: [
        authenticate,
        rateLimit('standard'),
        validateParams(idParamsSchema),
      ],
    },
    (req, reply) => controller.quorum(req, reply),
  );
}

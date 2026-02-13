import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  AuditorAssignmentsController,
  assignForMilestoneBodySchema,
} from '../controllers/auditor-assignments.controller.js';
import {
  CitizenPoolsController,
  selectForMilestoneBodySchema,
} from '../controllers/citizen-pools.controller.js';

const idParamsSchema = z.object({ id: z.string().uuid() });

const revokeBodySchema = z.object({
  reason: z.string().min(1).max(2000),
});

export async function milestoneAssignmentRoutes(fastify: FastifyInstance): Promise<void> {
  const auditorController = new AuditorAssignmentsController(fastify);
  const citizenController = new CitizenPoolsController(fastify);

  // POST /:id/assign-auditor — crypto-random auditor selection for milestone
  fastify.post(
    '/:id/assign-auditor',
    {
      preHandler: [
        authenticate,
        requireRole('admin'),
        rateLimit('elevated'),
        validateParams(idParamsSchema),
        validateBody(assignForMilestoneBodySchema),
      ],
    },
    (req, reply) => auditorController.assignForMilestone(req, reply),
  );

  // POST /:id/select-citizens — crypto-random citizen pool selection for milestone
  fastify.post(
    '/:id/select-citizens',
    {
      preHandler: [
        authenticate,
        requireRole('admin'),
        rateLimit('elevated'),
        validateParams(idParamsSchema),
        validateBody(selectForMilestoneBodySchema),
      ],
    },
    (req, reply) => citizenController.selectForMilestone(req, reply),
  );

  // POST /auditors/:id/revoke — revoke auditor credential for fraud
  fastify.post(
    '/auditors/:id/revoke',
    {
      preHandler: [
        authenticate,
        requireRole('admin'),
        rateLimit('elevated'),
        validateParams(idParamsSchema),
        validateBody(revokeBodySchema),
      ],
    },
    (req, reply) => auditorController.revokeForFraud(req, reply),
  );
}

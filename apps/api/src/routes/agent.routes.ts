import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  AgentController,
  createInvitationSchema,
  acceptInvitationParamsSchema,
  createProofRequestSchema,
  createCredentialOfferSchema,
  claimOfferParamsSchema,
  proofRequestParamsSchema,
} from '../controllers/agent.controller.js';

export async function agentRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const controller = new AgentController(fastify);

  // POST /invitations - Create connection invitation
  fastify.post(
    '/invitations',
    {
      preHandler: [
        authenticate,
        rateLimit('elevated'),
        validateBody(createInvitationSchema),
      ],
    },
    (request, reply) => controller.createInvitation(request, reply),
  );

  // POST /invitations/:id/accept - Accept invitation
  fastify.post(
    '/invitations/:id/accept',
    {
      preHandler: [
        authenticate,
        rateLimit('elevated'),
        validateParams(acceptInvitationParamsSchema),
      ],
    },
    (request, reply) => controller.acceptInvitation(request, reply),
  );

  // GET /connections - List my connections
  fastify.get(
    '/connections',
    {
      preHandler: [
        authenticate,
        rateLimit('standard'),
      ],
    },
    (request, reply) => controller.getConnections(request, reply),
  );

  // POST /proof-requests - Create proof request
  fastify.post(
    '/proof-requests',
    {
      preHandler: [
        authenticate,
        rateLimit('elevated'),
        validateBody(createProofRequestSchema),
      ],
    },
    (request, reply) => controller.createProofRequest(request, reply),
  );

  // GET /proof-requests/:id - Get proof request
  fastify.get(
    '/proof-requests/:id',
    {
      preHandler: [
        authenticate,
        rateLimit('standard'),
        validateParams(proofRequestParamsSchema),
      ],
    },
    (request, reply) => controller.getProofRequest(request, reply),
  );

  // POST /credential-offers - Create connectionless credential offer (admin)
  fastify.post(
    '/credential-offers',
    {
      preHandler: [
        authenticate,
        requireRole('admin'),
        rateLimit('elevated'),
        validateBody(createCredentialOfferSchema),
      ],
    },
    (request, reply) => controller.createCredentialOffer(request, reply),
  );

  // POST /credential-offers/:id/claim - Claim credential offer
  fastify.post(
    '/credential-offers/:id/claim',
    {
      preHandler: [
        authenticate,
        rateLimit('elevated'),
        validateParams(claimOfferParamsSchema),
      ],
    },
    (request, reply) => controller.claimCredentialOffer(request, reply),
  );
}

import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  VerificationController,
  verifyHashSchema,
  verifyQrSchema,
  createPresentationDefSchema,
  createAuthRequestSchema,
  validateAuthResponseSchema,
} from '../controllers/verification.controller.js';

export async function verificationRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const controller = new VerificationController(fastify);

  // GET /hash - Verify certificate by hash (public)
  fastify.get(
    '/hash',
    {
      preHandler: [
        rateLimit('standard'),
        validateQuery(verifyHashSchema),
      ],
    },
    (request, reply) => controller.verifyByHash(request, reply),
  );

  // POST /qr - Verify by QR payload (public)
  fastify.post(
    '/qr',
    {
      preHandler: [
        rateLimit('standard'),
        validateBody(verifyQrSchema),
      ],
    },
    (request, reply) => controller.verifyByQr(request, reply),
  );

  // POST /openid4vp/presentation-definition - Create presentation definition
  fastify.post(
    '/openid4vp/presentation-definition',
    {
      preHandler: [
        authenticate,
        rateLimit('elevated'),
        validateBody(createPresentationDefSchema),
      ],
    },
    (request, reply) => controller.createPresentationDefinition(request, reply),
  );

  // POST /openid4vp/authorization-request - Create authorization request
  fastify.post(
    '/openid4vp/authorization-request',
    {
      preHandler: [
        authenticate,
        rateLimit('elevated'),
        validateBody(createAuthRequestSchema),
      ],
    },
    (request, reply) => controller.createAuthorizationRequest(request, reply),
  );

  // POST /openid4vp/authorization-response - Validate authorization response
  fastify.post(
    '/openid4vp/authorization-response',
    {
      preHandler: [
        rateLimit('elevated'),
        validateBody(validateAuthResponseSchema),
      ],
    },
    (request, reply) => controller.validateAuthorizationResponse(request, reply),
  );
}

import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { ConsentController } from '../controllers/consent.controller.js';

const consentPurposeSchema = z.enum([
  'identity_verification',
  'attestation_submission',
  'data_sharing',
  'credential_issuance',
  'analytics',
]);

const grantConsentBodySchema = z.object({
  purpose: consentPurposeSchema,
  scope: z.string().min(1).max(500),
  legalBasis: z.string().min(1).max(500),
  ttlDays: z.number().int().positive().max(3650).optional(),
});

const revokeConsentBodySchema = z.object({
  purpose: consentPurposeSchema,
});

const purposeParamsSchema = z.object({
  purpose: consentPurposeSchema,
});

export async function consentRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = new ConsentController(fastify);

  // POST /grant — grant consent (authenticated)
  fastify.post(
    '/grant',
    { preHandler: [authenticate, rateLimit('standard'), validateBody(grantConsentBodySchema)] },
    (req, reply) => controller.grant(req, reply),
  );

  // POST /revoke — revoke consent (authenticated)
  fastify.post(
    '/revoke',
    { preHandler: [authenticate, rateLimit('standard'), validateBody(revokeConsentBodySchema)] },
    (req, reply) => controller.revoke(req, reply),
  );

  // GET / — list my consents (authenticated)
  fastify.get(
    '/',
    { preHandler: [authenticate, rateLimit('standard')] },
    (req, reply) => controller.list(req, reply),
  );

  // GET /check/:purpose — check consent (authenticated)
  fastify.get(
    '/check/:purpose',
    { preHandler: [authenticate, rateLimit('standard'), validateParams(purposeParamsSchema)] },
    (req, reply) => controller.check(req, reply),
  );
}

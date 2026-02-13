import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
  paginationSchema,
  uuidSchema,
  sha256HashSchema,
  revokeCertificateSchema,
  certificateStatusSchema,
} from '@tml/types';
import { CertificatesController } from '../controllers/certificates.controller.js';

const certListQuerySchema = paginationSchema.extend({
  status: certificateStatusSchema.optional(),
});

const idParamsSchema = z.object({ id: uuidSchema });
const hashParamsSchema = z.object({ hash: sha256HashSchema });

const tgrStatusBodySchema = z.object({
  status: certificateStatusSchema,
  tgrReference: z.string().optional(),
});

export async function certificateRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = new CertificatesController(fastify);

  // GET / — list certificates (authenticated)
  fastify.get(
    '/',
    { preHandler: [authenticate, rateLimit('standard'), validateQuery(certListQuerySchema)] },
    (req, reply) => controller.list(req, reply),
  );

  // GET /verify/:hash — PUBLIC endpoint, no auth, standard rate limit
  // IMPORTANT: registered before /:id to avoid route conflict
  fastify.get(
    '/verify/:hash',
    { preHandler: [rateLimit('standard'), validateParams(hashParamsSchema)] },
    (req, reply) => controller.verifyByHash(req, reply),
  );

  // GET /:id — get certificate by ID (authenticated)
  fastify.get(
    '/:id',
    { preHandler: [authenticate, rateLimit('standard'), validateParams(idParamsSchema)] },
    (req, reply) => controller.getById(req, reply),
  );

  // POST /:id/revoke — revoke certificate (admin only)
  fastify.post(
    '/:id/revoke',
    { preHandler: [authenticate, requireRole('admin'), rateLimit('elevated'), validateBody(revokeCertificateSchema), validateParams(idParamsSchema)] },
    (req, reply) => controller.revoke(req, reply),
  );

  // PATCH /:id/tgr-status — update TGR delivery status (admin only)
  fastify.patch(
    '/:id/tgr-status',
    { preHandler: [authenticate, requireRole('admin'), rateLimit('elevated'), validateBody(tgrStatusBodySchema), validateParams(idParamsSchema)] },
    (req, reply) => controller.updateTgrStatus(req, reply),
  );
}

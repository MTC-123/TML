import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateQuery } from '../middleware/validate.js';
import { auditLogQuerySchema } from '@tml/types';
import { AuditLogsController } from '../controllers/audit-logs.controller.js';

export async function auditLogsRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const controller = new AuditLogsController(fastify);

  // GET / - Query audit logs
  fastify.get(
    '/',
    {
      preHandler: [
        authenticate,
        requireRole('admin'),
        rateLimit('standard'),
        validateQuery(auditLogQuerySchema),
      ],
    },
    (request, reply) => controller.list(request, reply),
  );
}

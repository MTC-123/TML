import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { sha256Hex } from '@tml/crypto';

/**
 * Append-only audit log middleware.
 *
 * Hooks into `onResponse` for every mutating request (POST, PUT, PATCH, DELETE)
 * and writes an audit record to the database. The payload body is SHA-256 hashed
 * before storage — the raw body is never persisted.
 */
async function auditPlugin(fastify: FastifyInstance): Promise<void> {
  const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!MUTATING_METHODS.has(request.method)) return;

    // Skip health/readiness/docs endpoints
    if (request.url.startsWith('/health') || request.url.startsWith('/documentation')) return;

    const actorDid = request.actor?.did ?? 'anonymous';
    const statusCode = reply.statusCode;

    // Only log successful mutations (2xx)
    if (statusCode < 200 || statusCode >= 300) return;

    const payloadHash = request.body
      ? sha256Hex(JSON.stringify(request.body))
      : sha256Hex('');

    // Derive entity info from the URL pattern
    const urlParts = request.url.replace(/\?.*$/, '').split('/').filter(Boolean);
    // e.g. /api/projects/123 → entityType="projects", entityId="123"
    const entityType = urlParts[0] ?? 'unknown';
    const entityId = urlParts[1] ?? 'none';

    try {
      const action = methodToAction(request.method) as import('@prisma/client').AuditAction;
      await fastify.prisma.auditLog.create({
        data: {
          entityType,
          entityId,
          action,
          actorDid,
          payloadHash,
          metadata: {
            method: request.method,
            url: request.url,
            statusCode,
            requestId: request.id as string,
          },
        },
      });
    } catch {
      // Audit failure must never break the response. Log and move on.
      request.log.warn('Failed to write audit log entry');
    }
  });
}

function methodToAction(method: string): string {
  switch (method) {
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'unknown';
  }
}

export default fp(auditPlugin, {
  name: 'audit',
  dependencies: ['prisma'],
  fastify: '5.x',
});

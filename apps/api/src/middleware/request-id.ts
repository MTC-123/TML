import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Correlation ID propagation middleware.
 *
 * Reads an incoming `X-Request-Id` header (for distributed tracing across
 * services) or generates a new UUIDv4. The ID is:
 * - Set as `request.id` for Fastify/pino log correlation
 * - Echoed back in the `X-Request-Id` response header
 */
async function requestIdPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('onRequest', async (request, reply) => {
    const existing = request.headers['x-request-id'];
    const requestId =
      typeof existing === 'string' && existing.length > 0
        ? existing
        : crypto.randomUUID();

    // Fastify uses request.id in its built-in pino serializer
    request.id = requestId;
    reply.header('X-Request-Id', requestId);
  });
}

export default fp(requestIdPlugin, {
  name: 'request-id',
  fastify: '5.x',
});

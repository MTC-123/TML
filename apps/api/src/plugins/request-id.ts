import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

async function requestIdPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('onRequest', async (request, reply) => {
    const existing = request.headers['x-request-id'];
    const requestId =
      typeof existing === 'string' && existing.length > 0
        ? existing
        : crypto.randomUUID();

    request.id = requestId;
    reply.header('X-Request-Id', requestId);
  });
}

export default fp(requestIdPlugin, {
  name: 'request-id',
  fastify: '5.x',
});

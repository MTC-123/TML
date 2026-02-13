import type { FastifyInstance } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', async (_request, _reply) => {
    return { status: 'ok' };
  });

  fastify.get('/ready', async (request, reply) => {
    const checks = { db: 'ok' as string, redis: 'ok' as string };

    try {
      await fastify.prisma.$queryRawUnsafe('SELECT 1');
    } catch {
      checks.db = 'error';
    }

    try {
      await fastify.redis.ping();
    } catch {
      checks.redis = 'error';
    }

    const healthy = checks.db === 'ok' && checks.redis === 'ok';

    if (!healthy) {
      reply.code(503);
    }

    return {
      status: healthy ? 'ready' : 'degraded',
      db: checks.db,
      redis: checks.redis,
    };
  });
}

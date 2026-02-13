import type { FastifyInstance } from 'fastify';
import fastifyRedis from '@fastify/redis';
import fp from 'fastify-plugin';
import type { Env } from '../config/env.js';

async function redisPlugin(
  fastify: FastifyInstance,
  opts: { env: Env },
): Promise<void> {
  await fastify.register(fastifyRedis, {
    url: opts.env.REDIS_URL,
    closeClient: true,
  });
}

export default fp(redisPlugin, {
  name: 'redis',
  fastify: '5.x',
});

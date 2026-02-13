import type { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fp from 'fastify-plugin';
import type { Env } from '../config/env.js';

async function corsPlugin(
  fastify: FastifyInstance,
  opts: { env: Env },
): Promise<void> {
  await fastify.register(fastifyCors, {
    origin: opts.env.CORS_ORIGIN,
  });
}

export default fp(corsPlugin, {
  name: 'cors',
  fastify: '5.x',
});

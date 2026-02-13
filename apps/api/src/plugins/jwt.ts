import type { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fp from 'fastify-plugin';
import type { Env } from '../config/env.js';

async function jwtPlugin(
  fastify: FastifyInstance,
  opts: { env: Env },
): Promise<void> {
  await fastify.register(fastifyJwt, {
    secret: opts.env.JWT_SECRET,
    sign: {
      expiresIn: opts.env.JWT_EXPIRES_IN,
    },
  });
}

export default fp(jwtPlugin, {
  name: 'jwt',
  fastify: '5.x',
});

import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { AuthController } from '../controllers/auth.controller.js';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = new AuthController(fastify);

  // GET /login — public, strict rate limit, redirects to MOSIP
  fastify.get(
    '/login',
    { preHandler: [rateLimit('strict')] },
    (req, reply) => controller.login(req, reply),
  );

  // GET /callback — public, strict rate limit, exchange code for tokens
  fastify.get(
    '/callback',
    { preHandler: [rateLimit('strict')] },
    (req, reply) => controller.callback(req, reply),
  );

  // POST /refresh — authenticated, strict rate limit, refresh token
  fastify.post(
    '/refresh',
    { preHandler: [authenticate, rateLimit('strict')] },
    (req, reply) => controller.refresh(req, reply),
  );

  // GET /me — authenticated, standard rate limit, get profile
  fastify.get(
    '/me',
    { preHandler: [authenticate, rateLimit('standard')] },
    (req, reply) => controller.me(req, reply),
  );

  // POST /logout — authenticated, standard rate limit
  fastify.post(
    '/logout',
    { preHandler: [authenticate, rateLimit('standard')] },
    (req, reply) => controller.logout(req, reply),
  );
}

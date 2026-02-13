import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { loadEnv } from '../config/env.js';
import { ActorsRepository } from '../repositories/actors.repository.js';
import { AuthService } from '../services/auth.service.js';

export class AuthController {
  private service: AuthService;

  constructor(fastify: FastifyInstance) {
    const actorsRepo = new ActorsRepository(fastify.prisma);
    const env = loadEnv();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ioredis type adapter
    this.service = new AuthService(actorsRepo, fastify.redis as any, fastify.jwt, env);
  }

  async login(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = this.service.getLoginUrl();
    if (!result.ok) {
      throw result.error;
    }
    reply.redirect(result.value);
  }

  async callback(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { code } = request.query as { code?: string };
    if (!code) {
      reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Missing authorization code' } });
      return;
    }

    const result = await this.service.handleCallback(code);
    if (!result.ok) {
      throw result.error;
    }

    reply.send({
      accessToken: result.value.accessToken,
      refreshToken: result.value.refreshToken,
      actor: result.value.actor,
    });
  }

  async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { refreshToken } = request.body as { refreshToken?: string };
    if (!refreshToken) {
      reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Missing refresh token' } });
      return;
    }

    const result = await this.service.refreshToken(refreshToken);
    if (!result.ok) {
      throw result.error;
    }

    reply.send(result.value);
  }

  async me(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await this.service.getProfile(request.actor.actorId);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { refreshToken } = request.body as { refreshToken?: string };
    if (refreshToken) {
      const result = await this.service.logoutWithToken(refreshToken);
      if (!result.ok) {
        throw result.error;
      }
    } else {
      const result = await this.service.logout(request.actor.actorId);
      if (!result.ok) {
        throw result.error;
      }
    }
    reply.send({ success: true });
  }
}

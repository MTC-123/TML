import type { ActorRole } from '@tml/types';
import type { PrismaClient } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  did: string;
  roles: ActorRole[];
  actorId: string;
  iat: number;
  exp: number;
}

export interface ActorContext {
  did: string;
  roles: ActorRole[];
  actorId: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    actor: ActorContext;
  }
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

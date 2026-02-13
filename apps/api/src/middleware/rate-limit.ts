import type { FastifyReply, FastifyRequest } from 'fastify';

interface TierConfig {
  max: number;
  windowMs: number;
}

const TIERS = {
  standard: { max: 100, windowMs: 60_000 },
  elevated: { max: 30, windowMs: 60_000 },
  strict: { max: 10, windowMs: 60_000 },
} as const satisfies Record<string, TierConfig>;

export function rateLimit(
  tier: 'standard' | 'elevated' | 'strict',
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  const config = TIERS[tier];

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const redis = request.server.redis;
    const ip = request.ip;
    const key = `rl:${tier}:${ip}`;
    const windowSec = Math.ceil(config.windowMs / 1000);

    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSec);
    }

    const remaining = Math.max(0, config.max - current);
    const ttl = await redis.ttl(key);

    reply.header('X-RateLimit-Limit', config.max);
    reply.header('X-RateLimit-Remaining', remaining);
    reply.header('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + ttl);

    if (current > config.max) {
      reply.code(429);
      throw Object.assign(
        new Error('Too many requests, please try again later'),
        { statusCode: 429, code: 'RATE_LIMIT_EXCEEDED' },
      );
    }
  };
}

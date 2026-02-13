import { PrismaClient } from '@prisma/client';
import type { Env } from '../config.js';

let instance: PrismaClient | null = null;

/**
 * Returns a singleton PrismaClient configured with connection pooling.
 *
 * Prisma uses its built-in connection pool managed via the `connection_limit`
 * parameter in the DATABASE_URL. This helper appends the pool parameters
 * if they are not already present.
 */
export function createPrismaClient(env: Env): PrismaClient {
  if (instance) return instance;

  const url = new URL(env.DATABASE_URL);
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', String(env.DATABASE_POOL_MAX));
  }
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', '10');
  }

  instance = new PrismaClient({
    datasourceUrl: url.toString(),
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'stdout', level: 'query' },
            { emit: 'stdout', level: 'error' },
          ]
        : [{ emit: 'stdout', level: 'error' }],
  });

  return instance;
}

/** Disconnect and clear singleton — for tests and graceful shutdown. */
export async function disconnectPrisma(): Promise<void> {
  if (instance) {
    await instance.$disconnect();
    instance = null;
  }
}

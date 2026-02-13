import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { errorHandler } from './middleware/error-handler.js';
import { authenticate, requireRole } from './middleware/auth.js';
import requestIdPlugin from './middleware/request-id.js';
import { loadEnv, resetEnvCache } from './config.js';
import { ok, err, type Result } from './lib/result.js';
import { BaseService } from './services/base.service.js';
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
  ConflictError,
} from '@tml/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a minimal Fastify instance with JWT + error handler for testing,
 * without requiring real Postgres/Redis connections.
 */
async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(requestIdPlugin);

  // Register JWT with a test secret
  const { default: fastifyJwt } = await import('@fastify/jwt');
  await app.register(fastifyJwt, {
    secret: 'test-secret-that-is-at-least-32-characters-long!!',
    sign: { expiresIn: '1h' },
  });

  app.setErrorHandler(errorHandler);

  return app;
}

function signTestToken(
  app: FastifyInstance,
  payload: Record<string, unknown>,
): string {
  return app.jwt.sign(payload);
}

// ── Config tests ─────────────────────────────────────────────────────────────

describe('config.ts — environment validation', () => {
  const VALID_ENV = {
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'a'.repeat(32),
    MOSIP_ISSUER_URL: 'https://mosip.example.com',
    MOSIP_CLIENT_ID: 'client',
    MOSIP_CLIENT_SECRET: 'secret',
    MOSIP_REDIRECT_URI: 'https://app.example.com/callback',
    SYSTEM_SIGNING_KEY_HEX: 'a'.repeat(64),
  };

  afterAll(() => {
    resetEnvCache();
  });

  it('throws on missing required variables', () => {
    resetEnvCache();
    const original = { ...process.env };
    // Clear env
    for (const key of Object.keys(VALID_ENV)) {
      delete process.env[key];
    }
    expect(() => loadEnv()).toThrow('Invalid environment variables');
    // Restore
    Object.assign(process.env, original);
    resetEnvCache();
  });

  it('parses valid environment with defaults', () => {
    resetEnvCache();
    const original = { ...process.env };
    Object.assign(process.env, VALID_ENV);

    const env = loadEnv();
    expect(env.PORT).toBe(3000);
    expect(env.HOST).toBe('0.0.0.0');
    // NODE_ENV defaults to "development" but vitest sets it to "test"
    expect(['development', 'production', 'test']).toContain(env.NODE_ENV);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.RATE_LIMIT_MAX).toBe(100);
    expect(env.DATABASE_POOL_MIN).toBe(2);
    expect(env.DATABASE_POOL_MAX).toBe(10);

    Object.assign(process.env, original);
    resetEnvCache();
  });
});

// ── Result type tests ────────────────────────────────────────────────────────

describe('lib/result.ts — Result type', () => {
  it('ok() wraps a success value', () => {
    const result = ok(42);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });

  it('err() wraps an error', () => {
    const result = err(new Error('boom'));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('boom');
    }
  });
});

// ── Request-ID middleware tests ──────────────────────────────────────────────

describe('middleware/request-id.ts — correlation ID', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(requestIdPlugin);
    app.get('/test', async () => ({ ok: true }));
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('generates a UUID when no X-Request-Id is sent', async () => {
    const res = await app.inject({ method: 'GET', url: '/test' });
    const reqId = res.headers['x-request-id'];
    expect(reqId).toBeDefined();
    expect(typeof reqId).toBe('string');
    // UUID format
    expect(reqId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('echoes back an incoming X-Request-Id', async () => {
    const customId = 'my-trace-id-12345';
    const res = await app.inject({
      method: 'GET',
      url: '/test',
      headers: { 'x-request-id': customId },
    });
    expect(res.headers['x-request-id']).toBe(customId);
  });
});

// ── Health check tests ───────────────────────────────────────────────────────

describe('routes/health.routes.ts — health endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });

    // Mock prisma and redis on the instance for health routes
    const mockPrisma = {
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const mockRedis = {
      ping: vi.fn().mockResolvedValue('PONG'),
    };

    // Decorate before registering health routes
    await app.register(
      fp(async (f) => {
        f.decorate('prisma', mockPrisma);
        f.decorate('redis', mockRedis);
      }),
    );

    const { healthRoutes } = await import('./routes/health.routes.js');
    await app.register(healthRoutes, { prefix: '/health' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns { status: "ok" }', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('GET /health/ready returns 200 when DB + Redis are up', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ready');
    expect(body.db).toBe('ok');
    expect(body.redis).toBe('ok');
  });

  it('GET /health/ready returns 503 when DB is down', async () => {
    // Rebuild with failing prisma
    const failApp = Fastify({ logger: false });
    await failApp.register(
      fp(async (f) => {
        f.decorate('prisma', {
          $queryRawUnsafe: vi.fn().mockRejectedValue(new Error('connection refused')),
        });
        f.decorate('redis', {
          ping: vi.fn().mockResolvedValue('PONG'),
        });
      }),
    );
    const { healthRoutes } = await import('./routes/health.routes.js');
    await failApp.register(healthRoutes, { prefix: '/health' });
    await failApp.ready();

    const res = await failApp.inject({ method: 'GET', url: '/health/ready' });
    expect(res.statusCode).toBe(503);
    expect(res.json().db).toBe('error');

    await failApp.close();
  });
});

// ── Error handler tests ──────────────────────────────────────────────────────

describe('middleware/error-handler.ts — global error mapping', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    app.setErrorHandler(errorHandler);

    app.get('/not-found', async () => {
      throw new NotFoundError('Project', '123');
    });
    app.get('/validation', async () => {
      throw new ValidationError('Bad input', { field: 'name' });
    });
    app.get('/auth', async () => {
      throw new AuthorizationError('Forbidden');
    });
    app.get('/conflict', async () => {
      throw new ConflictError('Already exists');
    });
    app.get('/internal', async () => {
      throw new Error('secrets should not leak');
    });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('maps NotFoundError to 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/not-found' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });

  it('maps ValidationError to 400', async () => {
    const res = await app.inject({ method: 'GET', url: '/validation' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('maps AuthorizationError to 403', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth' });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe('AUTHORIZATION_ERROR');
  });

  it('maps ConflictError to 409', async () => {
    const res = await app.inject({ method: 'GET', url: '/conflict' });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('CONFLICT');
  });

  it('maps unknown errors to 500 without leaking message', async () => {
    const res = await app.inject({ method: 'GET', url: '/internal' });
    expect(res.statusCode).toBe(500);
    const body = res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).not.toContain('secrets');
  });
});

// ── Auth middleware tests ────────────────────────────────────────────────────

describe('middleware/auth.ts — JWT verification & RBAC', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();

    // Public route
    app.get('/public', async () => ({ ok: true }));

    // Authenticated route (any role)
    app.get(
      '/protected',
      { preHandler: [authenticate] },
      async (request) => ({
        did: request.actor.did,
        roles: request.actor.roles,
      }),
    );

    // Admin-only route
    app.get(
      '/admin-only',
      { preHandler: [authenticate, requireRole('admin')] },
      async () => ({ admin: true }),
    );

    // Multi-role route
    app.get(
      '/multi-role',
      {
        preHandler: [
          authenticate,
          requireRole('admin', 'independent_auditor'),
        ],
      },
      async () => ({ allowed: true }),
    );

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows access to public routes without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/public' });
    expect(res.statusCode).toBe(200);
  });

  it('rejects protected routes with missing token', async () => {
    const res = await app.inject({ method: 'GET', url: '/protected' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects protected routes with malformed token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'Bearer not.a.valid.jwt' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects expired tokens', async () => {
    // Sign a token that already expired 10 seconds ago by using a negative iat
    const nowSec = Math.floor(Date.now() / 1000);
    const token = app.jwt.sign({
      sub: 'did:key:z6MkTest',
      did: 'did:key:z6MkTest',
      roles: ['citizen'],
      actorId: 'actor-1',
      iat: nowSec - 7200, // issued 2 hours ago
      exp: nowSec - 3600, // expired 1 hour ago
    });

    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(401);
  });

  it('accepts valid token and enriches request.actor', async () => {
    const token = signTestToken(app, {
      sub: 'did:key:z6MkTestUser123',
      did: 'did:key:z6MkTestUser123',
      roles: ['citizen'],
      actorId: 'actor-abc',
    });

    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.did).toBe('did:key:z6MkTestUser123');
    expect(body.roles).toEqual(['citizen']);
  });

  it('rejects when user lacks required role', async () => {
    const token = signTestToken(app, {
      sub: 'did:key:z6MkCitizen',
      did: 'did:key:z6MkCitizen',
      roles: ['citizen'],
      actorId: 'actor-citizen',
    });

    const res = await app.inject({
      method: 'GET',
      url: '/admin-only',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe('AUTHORIZATION_ERROR');
  });

  it('allows access when user has one of the required roles', async () => {
    const token = signTestToken(app, {
      sub: 'did:key:z6MkAuditor',
      did: 'did:key:z6MkAuditor',
      roles: ['independent_auditor'],
      actorId: 'actor-auditor',
    });

    const res = await app.inject({
      method: 'GET',
      url: '/multi-role',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().allowed).toBe(true);
  });

  it('allows admin to access multi-role endpoint', async () => {
    const token = signTestToken(app, {
      sub: 'did:key:z6MkAdmin',
      did: 'did:key:z6MkAdmin',
      roles: ['admin'],
      actorId: 'actor-admin',
    });

    const res = await app.inject({
      method: 'GET',
      url: '/multi-role',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
  });
});

// ── BaseService tests ────────────────────────────────────────────────────────

describe('services/base.service.ts — base service class', () => {
  class TestService extends BaseService {
    findEntity(exists: boolean): Result<{ id: string }> {
      const entity = exists ? { id: '123' } : null;
      return this.ensureFound(entity, 'TestEntity', '123');
    }

    doConflict(): Result<never> {
      return this.conflict('Already exists', { field: 'name' });
    }

    doInvalid(): Result<never> {
      return this.invalid('Bad value');
    }
  }

  const mockAuditLog = {
    log: vi.fn().mockResolvedValue(undefined),
    query: vi.fn(),
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  it('ensureFound returns ok for existing entity', () => {
    const svc = new TestService(mockAuditLog);
    const result = svc.findEntity(true);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.id).toBe('123');
  });

  it('ensureFound returns NotFoundError for missing entity', () => {
    const svc = new TestService(mockAuditLog);
    const result = svc.findEntity(false);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError);
  });

  it('conflict() returns ConflictError', () => {
    const svc = new TestService(mockAuditLog);
    const result = svc.doConflict();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(ConflictError);
  });

  it('invalid() returns ValidationError', () => {
    const svc = new TestService(mockAuditLog);
    const result = svc.doInvalid();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(ValidationError);
  });
});

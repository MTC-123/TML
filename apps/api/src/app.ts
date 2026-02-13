import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { loadEnv } from './config.js';
import requestIdPlugin from './middleware/request-id.js';
import corsPlugin from './plugins/cors.js';
import redisPlugin from './plugins/redis.js';
import jwtPlugin from './plugins/jwt.js';
import prismaPlugin from './plugins/prisma.js';
import auditPlugin from './middleware/audit.js';
import { errorHandler } from './middleware/error-handler.js';
import { healthRoutes } from './routes/health.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { projectRoutes } from './routes/projects.routes.js';
import { milestoneRoutes } from './routes/milestones.routes.js';
import { certificateRoutes } from './routes/certificates.routes.js';
import { attestationRoutes } from './routes/attestations.routes.js';
import { auditorAssignmentsRoutes } from './routes/auditor-assignments.routes.js';
import { citizenPoolsRoutes } from './routes/citizen-pools.routes.js';
import { disputesRoutes } from './routes/disputes.routes.js';
import { ussdRoutes } from './routes/ussd.routes.js';
import { webhooksRoutes } from './routes/webhooks.routes.js';
import { auditLogsRoutes } from './routes/audit-logs.routes.js';

// Ensure Fastify type augmentations are loaded
import './lib/types.js';

export async function buildApp(
  opts?: FastifyServerOptions,
): Promise<FastifyInstance> {
  const env = loadEnv();

  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
    ...opts,
  });

  // ── Security ────────────────────────────────────────────────────────────
  await app.register(fastifyHelmet, {
    // Relax CSP for Swagger UI assets
    contentSecurityPolicy: env.NODE_ENV === 'production',
  });

  // ── Correlation ID ──────────────────────────────────────────────────────
  await app.register(requestIdPlugin);

  // ── CORS ────────────────────────────────────────────────────────────────
  await app.register(corsPlugin, { env });

  // ── Infrastructure ──────────────────────────────────────────────────────
  await app.register(redisPlugin, { env });
  await app.register(jwtPlugin, { env });
  await app.register(prismaPlugin);

  // ── Global rate limiting ────────────────────────────────────────────────
  await app.register(fastifyRateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    keyGenerator: (request) => {
      // Use DID for authenticated requests, IP for anonymous
      return request.actor?.did ?? request.ip;
    },
  });

  // ── OpenAPI / Swagger ───────────────────────────────────────────────────
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'TML API',
        description: 'Transparency Middleware Layer — Public Infrastructure Accountability',
        version: '0.1.0',
      },
      servers: [
        { url: `http://localhost:${env.PORT}`, description: 'Local dev' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });
  await app.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
  });

  // ── Audit middleware (after prisma is ready) ────────────────────────────
  await app.register(auditPlugin);

  // ── Global error handler ────────────────────────────────────────────────
  app.setErrorHandler(errorHandler);

  // ── Routes ──────────────────────────────────────────────────────────────
  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(projectRoutes, { prefix: '/projects' });
  await app.register(milestoneRoutes, { prefix: '/milestones' });
  await app.register(certificateRoutes, { prefix: '/certificates' });
  await app.register(attestationRoutes, { prefix: '/attestations' });
  await app.register(auditorAssignmentsRoutes, { prefix: '/auditor-assignments' });
  await app.register(citizenPoolsRoutes, { prefix: '/citizen-pools' });
  await app.register(disputesRoutes, { prefix: '/disputes' });
  await app.register(ussdRoutes, { prefix: '/ussd' });
  await app.register(webhooksRoutes, { prefix: '/webhooks' });
  await app.register(auditLogsRoutes, { prefix: '/audit-logs' });

  return app;
}

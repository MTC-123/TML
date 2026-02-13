import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { errorHandler } from './middleware/error-handler.js';
import { projectRoutes } from './routes/projects.routes.js';
import { projectMilestoneRoutes, milestoneRoutes } from './routes/milestones.routes.js';

// ── Mock Prisma Factory ──────────────────────────────────────────────────────

function createMockPrisma() {
  const projects: Record<string, any> = {};
  const milestones: Record<string, any> = {};
  const attestations: any[] = [];
  const auditLogs: any[] = [];

  return {
    _store: { projects, milestones, attestations, auditLogs },

    project: {
      findMany: vi.fn(async ({ where, skip, take, orderBy, include }: any = {}) => {
        let results = Object.values(projects).filter((p: any) => {
          if (where?.deletedAt === null && p.deletedAt !== null) return false;
          if (where?.status && p.status !== where.status) return false;
          if (where?.region && p.region !== where.region) return false;
          return true;
        });
        if (orderBy?.createdAt === 'desc') results.sort((a: any, b: any) => b.createdAt - a.createdAt);
        if (skip !== undefined) results = results.slice(skip);
        if (take !== undefined) results = results.slice(0, take);
        return results;
      }),
      findUnique: vi.fn(async ({ where, include }: any) => {
        const p = projects[where.id];
        if (!p) return null;
        if (include?.milestones) {
          const ms = Object.values(milestones).filter((m: any) =>
            m.projectId === where.id && m.deletedAt === null
          ).sort((a: any, b: any) => a.sequenceNumber - b.sequenceNumber);

          const milestonesWithRelations = ms.map((m: any) => ({
            ...m,
            attestations: include.milestones.include?.attestations
              ? attestations.filter((a: any) => a.milestoneId === m.id).map((a: any) => ({
                  type: a.type,
                  status: a.status,
                }))
              : undefined,
            complianceCertificate: include.milestones.include?.complianceCertificate
              ? null
              : undefined,
          }));
          return { ...p, milestones: milestonesWithRelations };
        }
        return p;
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        return Object.values(projects).find((p: any) =>
          p.name === where.name && p.region === where.region && p.deletedAt === null
        ) ?? null;
      }),
      count: vi.fn(async ({ where }: any = {}) => {
        return Object.values(projects).filter((p: any) => {
          if (where?.deletedAt === null && p.deletedAt !== null) return false;
          if (where?.status && p.status !== where.status) return false;
          if (where?.region && p.region !== where.region) return false;
          return true;
        }).length;
      }),
      create: vi.fn(async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const project = {
          id,
          name: data.name,
          region: data.region,
          budget: { toString: () => data.budget },
          donor: data.donor ?? null,
          status: 'draft',
          boundary: data.boundary ?? null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
        projects[id] = project;
        return project;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const p = projects[where.id];
        if (!p) throw new Error('Not found');
        const updated = { ...p, ...data, updatedAt: new Date() };
        if (data.budget !== undefined) {
          updated.budget = { toString: () => data.budget };
        }
        projects[where.id] = updated;
        return updated;
      }),
      groupBy: vi.fn(async () => []),
      aggregate: vi.fn(async () => ({ _sum: { budget: null }, _count: { id: 0 } })),
    },

    milestone: {
      findMany: vi.fn(async ({ where, skip, take, orderBy, include }: any = {}) => {
        let results = Object.values(milestones).filter((m: any) => {
          if (where?.projectId && m.projectId !== where.projectId) return false;
          if (where?.deletedAt === null && m.deletedAt !== null) return false;
          return true;
        });
        if (orderBy?.sequenceNumber === 'asc') results.sort((a: any, b: any) => a.sequenceNumber - b.sequenceNumber);
        if (skip !== undefined) results = results.slice(skip);
        if (take !== undefined) results = results.slice(0, take);
        if (include?.attestations) {
          results = results.map((m: any) => ({
            ...m,
            attestations: attestations.filter((a: any) => a.milestoneId === m.id).map((a: any) => ({
              type: a.type,
              status: a.status,
            })),
            complianceCertificate: include.complianceCertificate ? null : null,
          }));
        }
        return results;
      }),
      findUnique: vi.fn(async ({ where, include }: any) => {
        if (where.projectId_sequenceNumber) {
          const found = Object.values(milestones).find((m: any) =>
            m.projectId === where.projectId_sequenceNumber.projectId &&
            m.sequenceNumber === where.projectId_sequenceNumber.sequenceNumber
          );
          return found ?? null;
        }
        const m = milestones[where.id];
        if (!m) return null;
        if (include?.attestations) {
          return {
            ...m,
            attestations: attestations
              .filter((a: any) => a.milestoneId === m.id)
              .map((a: any) => ({
                ...a,
                gpsLatitude: { toString: () => a.gpsLatitude },
                gpsLongitude: { toString: () => a.gpsLongitude },
              })),
            complianceCertificate: null,
          };
        }
        return m;
      }),
      count: vi.fn(async ({ where }: any = {}) => {
        return Object.values(milestones).filter((m: any) => {
          if (where?.projectId && m.projectId !== where.projectId) return false;
          if (where?.deletedAt === null && m.deletedAt !== null) return false;
          return true;
        }).length;
      }),
      create: vi.fn(async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const milestone = {
          id,
          projectId: data.projectId,
          sequenceNumber: data.sequenceNumber,
          description: data.description,
          deadline: new Date(data.deadline),
          status: 'pending',
          requiredInspectorCount: data.requiredInspectorCount ?? 1,
          requiredAuditorCount: data.requiredAuditorCount ?? 1,
          requiredCitizenCount: data.requiredCitizenCount ?? 3,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
        milestones[id] = milestone;
        return milestone;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const m = milestones[where.id];
        if (!m) throw new Error('Not found');
        const updated = { ...m, ...data, updatedAt: new Date() };
        milestones[where.id] = updated;
        return updated;
      }),
    },

    auditLog: {
      create: vi.fn(async () => ({})),
    },
  };
}

// ── Test App Builder ─────────────────────────────────────────────────────────

async function buildTestApp(mockPrisma: ReturnType<typeof createMockPrisma>): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  // JWT
  const { default: fastifyJwt } = await import('@fastify/jwt');
  await app.register(fastifyJwt, {
    secret: 'test-secret-that-is-at-least-32-characters-long!!',
    sign: { expiresIn: '1h' },
  });

  // Mock redis
  const mockRedis = {
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(60),
  };

  // Decorate
  await app.register(fp(async (f) => {
    f.decorate('prisma', mockPrisma);
    f.decorate('redis', mockRedis);
  }));

  app.setErrorHandler(errorHandler);

  // Register routes with /api/v1 prefix
  await app.register(projectRoutes, { prefix: '/api/v1/projects' });
  await app.register(projectMilestoneRoutes, { prefix: '/api/v1/projects/:id/milestones' });
  await app.register(milestoneRoutes, { prefix: '/api/v1/milestones' });

  await app.ready();
  return app;
}

function signToken(app: FastifyInstance, payload: Record<string, unknown>): string {
  return app.jwt.sign(payload);
}

function adminToken(app: FastifyInstance): string {
  return signToken(app, {
    sub: 'did:key:z6MkAdmin',
    did: 'did:key:z6MkAdmin',
    roles: ['admin'],
    actorId: 'actor-admin',
  });
}

function citizenToken(app: FastifyInstance): string {
  return signToken(app, {
    sub: 'did:key:z6MkCitizen',
    did: 'did:key:z6MkCitizen',
    roles: ['citizen'],
    actorId: 'actor-citizen',
  });
}

function contractorToken(app: FastifyInstance): string {
  return signToken(app, {
    sub: 'did:key:z6MkContractor',
    did: 'did:key:z6MkContractor',
    roles: ['contractor_engineer'],
    actorId: 'actor-contractor',
  });
}

// ── Projects Tests ───────────────────────────────────────────────────────────

describe('Projects — /api/v1/projects', () => {
  let app: FastifyInstance;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeAll(async () => {
    mockPrisma = createMockPrisma();
    app = await buildTestApp(mockPrisma);
  });

  afterAll(async () => {
    await app.close();
  });

  // ── POST /api/v1/projects ──────────────────────────────────────────────

  describe('POST /api/v1/projects', () => {
    it('creates a project with geofence polygon (admin)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: {
          name: 'Ifrane Road Project',
          region: 'Fes-Meknes',
          budget: '50000000.00',
          donor: 'World Bank',
          boundary: [
            { lat: 33.53, lng: -5.11 },
            { lat: 33.54, lng: -5.10 },
            { lat: 33.52, lng: -5.09 },
          ],
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.name).toBe('Ifrane Road Project');
      expect(body.region).toBe('Fes-Meknes');
      expect(body.budget).toBe('50000000.00');
      expect(body.status).toBe('draft');
      expect(body.boundary).toHaveLength(3);
    });

    it('returns 400 on invalid body (missing name)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: {
          region: 'Fes-Meknes',
          budget: '10000.00',
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 on invalid budget format', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: {
          name: 'Bad Budget',
          region: 'Rabat',
          budget: 'not-a-number',
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 on invalid geofence (< 3 points)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: {
          name: 'Bad Geo',
          region: 'Rabat',
          budget: '1000.00',
          boundary: [{ lat: 33.0, lng: -5.0 }],
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it('returns 401 without token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        payload: { name: 'X', region: 'Y', budget: '100.00' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('returns 403 for non-admin (citizen)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        headers: { authorization: `Bearer ${citizenToken(app)}` },
        payload: { name: 'X', region: 'Y', budget: '100.00' },
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('AUTHORIZATION_ERROR');
    });

    it('returns 409 on duplicate name + region', async () => {
      // First create succeeds (already created above with same name)
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: {
          name: 'Ifrane Road Project',
          region: 'Fes-Meknes',
          budget: '999.00',
        },
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().error.code).toBe('CONFLICT');
    });
  });

  // ── GET /api/v1/projects ───────────────────────────────────────────────

  describe('GET /api/v1/projects', () => {
    it('lists projects with pagination', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/projects?page=1&limit=10',
        headers: { authorization: `Bearer ${citizenToken(app)}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toBeInstanceOf(Array);
      expect(body.pagination).toBeDefined();
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(10);
    });

    it('filters by status', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/projects?status=draft',
        headers: { authorization: `Bearer ${citizenToken(app)}` },
      });

      expect(res.statusCode).toBe(200);
    });

    it('filters by region', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/projects?region=Fes-Meknes',
        headers: { authorization: `Bearer ${citizenToken(app)}` },
      });

      expect(res.statusCode).toBe(200);
    });

    it('returns 401 without token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/projects',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /api/v1/projects/:id ───────────────────────────────────────────

  describe('GET /api/v1/projects/:id', () => {
    it('returns project detail with milestones and attestation progress', async () => {
      // Get the project ID from the store
      const projId = Object.keys(mockPrisma._store.projects)[0]!;

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${projId}`,
        headers: { authorization: `Bearer ${citizenToken(app)}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.project).toBeDefined();
      expect(body.project.id).toBe(projId);
      expect(body.milestones).toBeInstanceOf(Array);
    });

    it('returns 404 for non-existent project', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/projects/00000000-0000-0000-0000-000000000000',
        headers: { authorization: `Bearer ${citizenToken(app)}` },
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe('NOT_FOUND');
    });

    it('returns 400 for invalid UUID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/projects/not-a-uuid',
        headers: { authorization: `Bearer ${citizenToken(app)}` },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // ── PATCH /api/v1/projects/:id ─────────────────────────────────────────

  describe('PATCH /api/v1/projects/:id', () => {
    it('updates project (admin)', async () => {
      const projId = Object.keys(mockPrisma._store.projects)[0]!;

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/projects/${projId}`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { name: 'Updated Project Name' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.name).toBe('Updated Project Name');
    });

    it('returns 403 for non-admin', async () => {
      const projId = Object.keys(mockPrisma._store.projects)[0]!;

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/projects/${projId}`,
        headers: { authorization: `Bearer ${citizenToken(app)}` },
        payload: { name: 'Hack' },
      });

      expect(res.statusCode).toBe(403);
    });

    it('returns 404 for non-existent project', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/projects/00000000-0000-0000-0000-000000000000',
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { name: 'Ghost' },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  // ── GET /api/v1/projects/:id/dashboard ─────────────────────────────────

  describe('GET /api/v1/projects/:id/dashboard', () => {
    it('returns aggregated stats', async () => {
      const projId = Object.keys(mockPrisma._store.projects)[0]!;

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${projId}/dashboard`,
        headers: { authorization: `Bearer ${citizenToken(app)}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.project).toBeDefined();
      expect(body.milestonesByStatus).toBeDefined();
      expect(typeof body.totalMilestones).toBe('number');
      expect(typeof body.completedMilestones).toBe('number');
      expect(body.attestationProgress).toBeDefined();
      expect(typeof body.attestationProgress.totalRequired).toBe('number');
      expect(typeof body.attestationProgress.totalSubmitted).toBe('number');
      expect(typeof body.attestationProgress.totalVerified).toBe('number');
    });

    it('returns 404 for non-existent project', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/projects/00000000-0000-0000-0000-000000000000/dashboard',
        headers: { authorization: `Bearer ${citizenToken(app)}` },
      });

      expect(res.statusCode).toBe(404);
    });
  });
});

// ── Milestones Tests ─────────────────────────────────────────────────────────

describe('Milestones — /api/v1/projects/:id/milestones & /api/v1/milestones', () => {
  let app: FastifyInstance;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let projectId: string;

  beforeAll(async () => {
    mockPrisma = createMockPrisma();
    app = await buildTestApp(mockPrisma);

    // Seed a project
    const p = await mockPrisma.project.create({
      data: {
        name: 'Test Project',
        region: 'Rabat',
        budget: '100000.00',
        donor: null,
      },
    });
    projectId = p.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── POST /api/v1/projects/:id/milestones ───────────────────────────────

  describe('POST /api/v1/projects/:id/milestones', () => {
    it('creates a milestone (admin)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${projectId}/milestones`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: {
          sequenceNumber: 1,
          description: 'Foundation poured',
          deadline: '2025-12-31T00:00:00.000Z',
          requiredInspectorCount: 1,
          requiredAuditorCount: 1,
          requiredCitizenCount: 3,
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.projectId).toBe(projectId);
      expect(body.sequenceNumber).toBe(1);
      expect(body.description).toBe('Foundation poured');
      expect(body.status).toBe('pending');
    });

    it('returns 400 on invalid body (missing description)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${projectId}/milestones`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: {
          sequenceNumber: 2,
          deadline: '2025-12-31T00:00:00.000Z',
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 on invalid sequenceNumber (0)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${projectId}/milestones`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: {
          sequenceNumber: 0,
          description: 'Bad seq',
          deadline: '2025-12-31T00:00:00.000Z',
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it('returns 401 without token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${projectId}/milestones`,
        payload: {
          sequenceNumber: 2,
          description: 'No auth',
          deadline: '2025-12-31T00:00:00.000Z',
        },
      });

      expect(res.statusCode).toBe(401);
    });

    it('returns 403 for non-admin (citizen)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${projectId}/milestones`,
        headers: { authorization: `Bearer ${citizenToken(app)}` },
        payload: {
          sequenceNumber: 2,
          description: 'Citizen cant create',
          deadline: '2025-12-31T00:00:00.000Z',
        },
      });

      expect(res.statusCode).toBe(403);
    });

    it('returns 404 for non-existent project', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/projects/00000000-0000-0000-0000-000000000000/milestones',
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: {
          sequenceNumber: 1,
          description: 'Ghost project',
          deadline: '2025-12-31T00:00:00.000Z',
        },
      });

      expect(res.statusCode).toBe(404);
    });

    it('returns 409 on duplicate sequence number', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${projectId}/milestones`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: {
          sequenceNumber: 1,
          description: 'Duplicate seq',
          deadline: '2025-12-31T00:00:00.000Z',
        },
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().error.code).toBe('CONFLICT');
    });
  });

  // ── GET /api/v1/projects/:id/milestones ────────────────────────────────

  describe('GET /api/v1/projects/:id/milestones', () => {
    it('lists milestones with attestation summary', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${projectId}/milestones?page=1&limit=10`,
        headers: { authorization: `Bearer ${citizenToken(app)}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data[0].attestationSummary).toBeDefined();
      expect(body.pagination).toBeDefined();
    });

    it('returns 404 for non-existent project', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/projects/00000000-0000-0000-0000-000000000000/milestones',
        headers: { authorization: `Bearer ${citizenToken(app)}` },
      });

      expect(res.statusCode).toBe(404);
    });

    it('returns 401 without token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${projectId}/milestones`,
      });

      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /api/v1/milestones/:id ─────────────────────────────────────────

  describe('GET /api/v1/milestones/:id', () => {
    it('returns milestone detail with all attestations', async () => {
      const msId = Object.keys(mockPrisma._store.milestones)[0]!;

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/milestones/${msId}`,
        headers: { authorization: `Bearer ${citizenToken(app)}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.milestone).toBeDefined();
      expect(body.milestone.id).toBe(msId);
      expect(body.attestations).toBeInstanceOf(Array);
    });

    it('returns 404 for non-existent milestone', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/milestones/00000000-0000-0000-0000-000000000000',
        headers: { authorization: `Bearer ${citizenToken(app)}` },
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe('NOT_FOUND');
    });

    it('returns 400 for invalid UUID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/milestones/not-valid',
        headers: { authorization: `Bearer ${citizenToken(app)}` },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // ── PATCH /api/v1/milestones/:id/status ────────────────────────────────

  describe('PATCH /api/v1/milestones/:id/status', () => {
    it('transitions pending → in_progress (admin)', async () => {
      const msId = Object.keys(mockPrisma._store.milestones)[0]!;

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/milestones/${msId}/status`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { status: 'in_progress' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().status).toBe('in_progress');
    });

    it('transitions in_progress → attestation_in_progress (contractor)', async () => {
      const msId = Object.keys(mockPrisma._store.milestones)[0]!;

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/milestones/${msId}/status`,
        headers: { authorization: `Bearer ${contractorToken(app)}` },
        payload: { status: 'attestation_in_progress' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().status).toBe('attestation_in_progress');
    });

    it('rejects invalid transition (attestation_in_progress → pending)', async () => {
      const msId = Object.keys(mockPrisma._store.milestones)[0]!;

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/milestones/${msId}/status`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { status: 'pending' },
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().error.code).toBe('CONFLICT');
      expect(res.json().error.details.currentStatus).toBe('attestation_in_progress');
    });

    it('transitions attestation_in_progress → failed (admin)', async () => {
      const msId = Object.keys(mockPrisma._store.milestones)[0]!;

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/milestones/${msId}/status`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { status: 'failed' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().status).toBe('failed');
    });

    it('transitions failed → in_progress (retry)', async () => {
      const msId = Object.keys(mockPrisma._store.milestones)[0]!;

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/milestones/${msId}/status`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { status: 'in_progress' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().status).toBe('in_progress');
    });

    it('returns 403 for citizen', async () => {
      const msId = Object.keys(mockPrisma._store.milestones)[0]!;

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/milestones/${msId}/status`,
        headers: { authorization: `Bearer ${citizenToken(app)}` },
        payload: { status: 'in_progress' },
      });

      expect(res.statusCode).toBe(403);
    });

    it('returns 400 for invalid status value', async () => {
      const msId = Object.keys(mockPrisma._store.milestones)[0]!;

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/milestones/${msId}/status`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { status: 'nonexistent_status' },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 for non-existent milestone', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/milestones/00000000-0000-0000-0000-000000000000/status',
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { status: 'in_progress' },
      });

      expect(res.statusCode).toBe(404);
    });

    it('returns 401 without token', async () => {
      const msId = Object.keys(mockPrisma._store.milestones)[0]!;

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/milestones/${msId}/status`,
        payload: { status: 'in_progress' },
      });

      expect(res.statusCode).toBe(401);
    });
  });
});

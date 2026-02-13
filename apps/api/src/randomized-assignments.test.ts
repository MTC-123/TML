import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { errorHandler } from './middleware/error-handler.js';
import { milestoneAssignmentRoutes } from './routes/milestone-assignments.routes.js';
import { auditorAssignmentsRoutes } from './routes/auditor-assignments.routes.js';
import { citizenPoolsRoutes } from './routes/citizen-pools.routes.js';

// ── Mock @tml/crypto ────────────────────────────────────────────────────────

vi.mock('@tml/crypto', () => ({
  sha256Hex: vi.fn().mockReturnValue('0'.repeat(64)),
  verifyAttestation: vi.fn().mockReturnValue(true),
  createStubVerifier: vi.fn().mockReturnValue({
    verifyProof: vi.fn().mockResolvedValue(true),
  }),
  generateCertificate: vi.fn().mockReturnValue({
    certificateHash: 'mock-cert-hash',
    digitalSignature: 'mock-cert-sig',
    milestoneId: 'x',
    projectId: 'x',
    attestations: [],
    issuedAt: new Date().toISOString(),
  }),
  verifyPayload: vi.fn().mockReturnValue(true),
  keyPairFromPrivateKey: vi.fn().mockReturnValue({
    publicKey: new Uint8Array(32),
    privateKey: new Uint8Array(64),
  }),
  InvalidSignatureError: class extends Error { code = 'INVALID_SIGNATURE'; },
  ExpiredCredentialError: class extends Error { code = 'EXPIRED_CREDENTIAL'; },
  TamperedDataError: class extends Error { code = 'TAMPERED_DATA'; },
  MalformedDIDError: class extends Error { code = 'MALFORMED_DID'; },
  CryptoError: class extends Error { code = 'CRYPTO_ERROR'; },
}));

vi.mock('./config/env.js', () => ({
  loadEnv: vi.fn().mockReturnValue({
    NODE_ENV: 'test',
    PORT: 3000,
    HOST: '0.0.0.0',
    LOG_LEVEL: 'silent',
    JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long!!',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    RATE_LIMIT_MAX: 1000,
    RATE_LIMIT_WINDOW_MS: 60000,
    SYSTEM_SIGNING_KEY_HEX: 'ab'.repeat(32),
    CORS_ORIGIN: '*',
  }),
}));

// ── Stable UUIDs ────────────────────────────────────────────────────────────

const ID = {
  project: '10000000-aaaa-0000-0000-000000000001',
  milestone: '20000000-aaaa-0000-0000-000000000001',
  orgContractor: '40000000-aaaa-0000-0000-000000000001',
  orgAuditor: '40000000-aaaa-0000-0000-000000000002',
  // Auditors
  auditor1: '30000000-aaaa-0000-0000-000000000001',
  auditor2: '30000000-aaaa-0000-0000-000000000002',
  auditor3: '30000000-aaaa-0000-0000-000000000003',
  auditorConflict: '30000000-aaaa-0000-0000-000000000004',
  // Citizens
  citizen1: '30000000-bbbb-0000-0000-000000000001',
  citizen2: '30000000-bbbb-0000-0000-000000000002',
  citizen3: '30000000-bbbb-0000-0000-000000000003',
  citizen4: '30000000-bbbb-0000-0000-000000000004',
  citizen5: '30000000-bbbb-0000-0000-000000000005',
  citizen6: '30000000-bbbb-0000-0000-000000000006',
  citizen7: '30000000-bbbb-0000-0000-000000000007',
  // Contractor
  contractor: '30000000-cccc-0000-0000-000000000001',
  // Trusted issuer
  issuer1: '50000000-aaaa-0000-0000-000000000001',
} as const;

// ── Mock Prisma Factory ─────────────────────────────────────────────────────

function createMockPrisma() {
  const actors: Record<string, any> = {
    [ID.auditor1]: {
      id: ID.auditor1, did: 'did:key:z6MkAuditor1', cnieHash: 'a1'.repeat(32),
      roles: ['independent_auditor'], createdAt: new Date(), updatedAt: new Date(),
    },
    [ID.auditor2]: {
      id: ID.auditor2, did: 'did:key:z6MkAuditor2', cnieHash: 'a2'.repeat(32),
      roles: ['independent_auditor'], createdAt: new Date(), updatedAt: new Date(),
    },
    [ID.auditor3]: {
      id: ID.auditor3, did: 'did:key:z6MkAuditor3', cnieHash: 'a3'.repeat(32),
      roles: ['independent_auditor'], createdAt: new Date(), updatedAt: new Date(),
    },
    [ID.auditorConflict]: {
      id: ID.auditorConflict, did: 'did:key:z6MkAuditorConflict', cnieHash: 'a4'.repeat(32),
      roles: ['independent_auditor'], createdAt: new Date(), updatedAt: new Date(),
    },
    [ID.citizen1]: {
      id: ID.citizen1, did: 'did:key:z6MkCitizen1', cnieHash: 'c1'.repeat(32),
      roles: ['citizen'], createdAt: new Date(), updatedAt: new Date(),
    },
    [ID.citizen2]: {
      id: ID.citizen2, did: 'did:key:z6MkCitizen2', cnieHash: 'c2'.repeat(32),
      roles: ['citizen'], createdAt: new Date(), updatedAt: new Date(),
    },
    [ID.citizen3]: {
      id: ID.citizen3, did: 'did:key:z6MkCitizen3', cnieHash: 'c3'.repeat(32),
      roles: ['citizen'], createdAt: new Date(), updatedAt: new Date(),
    },
    [ID.citizen4]: {
      id: ID.citizen4, did: 'did:key:z6MkCitizen4', cnieHash: 'c4'.repeat(32),
      roles: ['citizen'], createdAt: new Date(), updatedAt: new Date(),
    },
    [ID.citizen5]: {
      id: ID.citizen5, did: 'did:key:z6MkCitizen5', cnieHash: 'c5'.repeat(32),
      roles: ['citizen'], createdAt: new Date(), updatedAt: new Date(),
    },
    [ID.citizen6]: {
      id: ID.citizen6, did: 'did:key:z6MkCitizen6', cnieHash: 'c6'.repeat(32),
      roles: ['citizen'], createdAt: new Date(), updatedAt: new Date(),
    },
    [ID.citizen7]: {
      id: ID.citizen7, did: 'did:key:z6MkCitizen7', cnieHash: 'c7'.repeat(32),
      roles: ['citizen'], createdAt: new Date(), updatedAt: new Date(),
    },
    [ID.contractor]: {
      id: ID.contractor, did: 'did:key:z6MkContractor', cnieHash: 'co'.repeat(32),
      roles: ['contractor_engineer'], createdAt: new Date(), updatedAt: new Date(),
    },
  };

  const auditorAssignments: any[] = [];
  const citizenPools: any[] = [];
  const attestations: any[] = [];
  const auditLogs: any[] = [];

  // Organization membership: auditorConflict shares org with contractor
  const actorOrganizations: any[] = [
    {
      id: randomUUID(), actorId: ID.contractor, organizationId: ID.orgContractor,
      role: 'engineer', validFrom: new Date(), validUntil: null,
    },
    {
      id: randomUUID(), actorId: ID.auditorConflict, organizationId: ID.orgContractor,
      role: 'auditor', validFrom: new Date(), validUntil: null,
    },
  ];

  const trustedIssuers: Record<string, any> = {
    [ID.issuer1]: {
      id: ID.issuer1, issuerDid: 'did:key:z6MkAuditor1',
      issuerName: 'Auditor 1', credentialTypes: ['auditor'],
      active: true, revocationReason: null,
      activatedAt: new Date(), revokedAt: null, updatedAt: new Date(),
    },
  };

  const projects: Record<string, any> = {
    [ID.project]: {
      id: ID.project, name: 'Test Project', region: 'casa',
      budget: { toString: () => '1000000' }, status: 'active',
      boundary: null, donor: null,
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    },
  };

  const milestones: Record<string, any> = {
    [ID.milestone]: {
      id: ID.milestone, projectId: ID.project, sequenceNumber: 1,
      description: 'Test milestone', deadline: new Date('2026-12-31'),
      status: 'attestation_in_progress',
      requiredInspectorCount: 1, requiredAuditorCount: 1, requiredCitizenCount: 3,
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    },
  };

  return {
    _store: { actors, auditorAssignments, citizenPools, attestations, auditLogs, actorOrganizations, trustedIssuers, projects, milestones },

    actor: {
      findUnique: vi.fn(async ({ where }: any) => actors[where.id] ?? null),
      findMany: vi.fn(async ({ where }: any) => {
        return Object.values(actors).filter((a: any) => {
          if (where?.roles?.has && !a.roles.includes(where.roles.has)) return false;
          return true;
        });
      }),
    },

    actorOrganization: {
      findMany: vi.fn(async ({ where, select, distinct }: any) => {
        let results = actorOrganizations.filter((ao: any) => {
          if (where?.actorId?.in && !where.actorId.in.includes(ao.actorId)) return false;
          if (where?.organizationId?.in && !where.organizationId.in.includes(ao.organizationId)) return false;
          if (where?.validUntil === null && ao.validUntil !== null) return false;
          return true;
        });
        if (distinct?.length) {
          const key = distinct[0];
          const seen = new Set<string>();
          results = results.filter((r: any) => {
            if (seen.has(r[key])) return false;
            seen.add(r[key]);
            return true;
          });
        }
        if (select) {
          return results.map((r: any) => {
            const picked: any = {};
            for (const k of Object.keys(select)) picked[k] = r[k];
            return picked;
          });
        }
        return results;
      }),
    },

    auditorAssignment: {
      findMany: vi.fn(async ({ where, orderBy }: any) => {
        let results = auditorAssignments.filter((a: any) => {
          if (where?.milestoneId && a.milestoneId !== where.milestoneId) return false;
          if (where?.milestone?.projectId && a._projectId !== where.milestone.projectId) return false;
          if (where?.rotationRound?.gte && a.rotationRound < where.rotationRound.gte) return false;
          return true;
        });
        if (orderBy?.assignedAt === 'desc') {
          results.sort((a: any, b: any) => b.assignedAt - a.assignedAt);
        }
        return results;
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.milestoneId_auditorId) {
          return auditorAssignments.find((a: any) =>
            a.milestoneId === where.milestoneId_auditorId.milestoneId &&
            a.auditorId === where.milestoneId_auditorId.auditorId,
          ) ?? null;
        }
        return auditorAssignments.find((a: any) => a.id === where.id) ?? null;
      }),
      create: vi.fn(async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const assignment = {
          id, milestoneId: data.milestoneId, auditorId: data.auditorId,
          rotationRound: data.rotationRound, conflictDeclared: false,
          conflictReason: null, status: 'assigned', assignedAt: now, updatedAt: now,
          _projectId: milestones[data.milestoneId]?.projectId,
        };
        auditorAssignments.push(assignment);
        return assignment;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const a = auditorAssignments.find((x: any) => x.id === where.id);
        if (!a) throw new Error('Not found');
        Object.assign(a, data, { updatedAt: new Date() });
        return a;
      }),
      aggregate: vi.fn(async ({ where, _max }: any) => {
        const matching = auditorAssignments.filter((a: any) => {
          if (where?.milestoneId && a.milestoneId !== where.milestoneId) return false;
          return true;
        });
        const maxRound = matching.length > 0
          ? Math.max(...matching.map((a: any) => a.rotationRound))
          : 0;
        return { _max: { rotationRound: maxRound || null } };
      }),
    },

    attestation: {
      findMany: vi.fn(async ({ where, select, distinct }: any) => {
        let results = attestations.filter((a: any) => {
          if (where?.milestone?.projectId && a._projectId !== where.milestone.projectId) return false;
          if (where?.type && a.type !== where.type) return false;
          if (where?.status?.in && !where.status.in.includes(a.status)) return false;
          return true;
        });
        if (distinct?.length) {
          const key = distinct[0];
          const seen = new Set<string>();
          results = results.filter((r: any) => {
            if (seen.has(r[key])) return false;
            seen.add(r[key]);
            return true;
          });
        }
        if (select) {
          return results.map((r: any) => {
            const picked: any = {};
            for (const k of Object.keys(select)) picked[k] = r[k];
            return picked;
          });
        }
        return results;
      }),
    },

    citizenPool: {
      findMany: vi.fn(async ({ where, orderBy, select }: any) => {
        let results = citizenPools.filter((p: any) => {
          if (where?.milestoneId && p.milestoneId !== where.milestoneId) return false;
          if (where?.citizenId?.in && !where.citizenId.in.includes(p.citizenId)) return false;
          if (where?.status?.in && !where.status.in.includes(p.status)) return false;
          return true;
        });
        if (orderBy?.enrolledAt === 'desc') {
          results.sort((a: any, b: any) => b.enrolledAt - a.enrolledAt);
        }
        if (select) {
          return results.map((r: any) => {
            const picked: any = {};
            for (const k of Object.keys(select)) picked[k] = r[k];
            return picked;
          });
        }
        return results;
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        if (where?.milestoneId_citizenId) {
          return citizenPools.find((p: any) =>
            p.milestoneId === where.milestoneId_citizenId.milestoneId &&
            p.citizenId === where.milestoneId_citizenId.citizenId,
          ) ?? null;
        }
        return citizenPools.find((p: any) => p.id === where.id) ?? null;
      }),
      create: vi.fn(async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const pool = {
          id, milestoneId: data.milestoneId, citizenId: data.citizenId,
          proximityProofHash: data.proximityProofHash,
          assuranceTier: data.assuranceTier ?? 'cso_mediated',
          status: 'enrolled', enrolledAt: now, updatedAt: now,
        };
        citizenPools.push(pool);
        return pool;
      }),
      count: vi.fn(async ({ where }: any) => {
        return citizenPools.filter((p: any) => {
          if (where?.citizenId && p.citizenId !== where.citizenId) return false;
          if (where?.status?.in && !where.status.in.includes(p.status)) return false;
          return true;
        }).length;
      }),
      groupBy: vi.fn(async ({ by, where, _count }: any) => {
        const filtered = citizenPools.filter((p: any) => {
          if (where?.citizenId?.in && !where.citizenId.in.includes(p.citizenId)) return false;
          if (where?.status?.in && !where.status.in.includes(p.status)) return false;
          return true;
        });
        const groups = new Map<string, number>();
        for (const p of filtered) {
          const key = p[by[0]];
          groups.set(key, (groups.get(key) ?? 0) + 1);
        }
        return [...groups.entries()].map(([citizenId, count]) => ({
          citizenId,
          _count: { id: count },
        }));
      }),
    },

    trustedIssuerRegistry: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id) return trustedIssuers[where.id] ?? null;
        if (where.issuerDid) {
          return Object.values(trustedIssuers).find((t: any) => t.issuerDid === where.issuerDid) ?? null;
        }
        return null;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const t = trustedIssuers[where.id];
        if (!t) throw new Error('Not found');
        Object.assign(t, data, { updatedAt: new Date() });
        return t;
      }),
    },

    project: {
      findUnique: vi.fn(async ({ where }: any) => projects[where.id] ?? null),
    },

    milestone: {
      findUnique: vi.fn(async ({ where }: any) => milestones[where.id] ?? null),
    },

    auditLog: {
      create: vi.fn(async () => ({})),
    },
  };
}

// ── Test App Builder ────────────────────────────────────────────────────────

async function buildTestApp(mockPrisma: ReturnType<typeof createMockPrisma>): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  const { default: fastifyJwt } = await import('@fastify/jwt');
  await app.register(fastifyJwt, {
    secret: 'test-secret-that-is-at-least-32-characters-long!!',
    sign: { expiresIn: '1h' },
  });

  const mockRedis = {
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(60),
  };

  await app.register(fp(async (f) => {
    f.decorate('prisma', mockPrisma);
    f.decorate('redis', mockRedis);
  }));

  app.setErrorHandler(errorHandler);

  await app.register(milestoneAssignmentRoutes, { prefix: '/api/v1/milestones' });
  await app.register(auditorAssignmentsRoutes, { prefix: '/api/v1/auditor-assignments' });
  await app.register(citizenPoolsRoutes, { prefix: '/api/v1/citizen-pools' });

  await app.ready();
  return app;
}

function adminToken(app: FastifyInstance): string {
  return app.jwt.sign({
    sub: 'did:key:z6MkAdmin',
    did: 'did:key:z6MkAdmin',
    roles: ['admin'],
    actorId: 'actor-admin',
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Randomized Assignment Systems', () => {
  let app: FastifyInstance;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeAll(async () => {
    mockPrisma = createMockPrisma();
    app = await buildTestApp(mockPrisma);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Clear mutable stores between tests
    mockPrisma._store.auditorAssignments.length = 0;
    mockPrisma._store.citizenPools.length = 0;
    mockPrisma._store.attestations.length = 0;
    mockPrisma._store.auditLogs.length = 0;

    // Reset trusted issuer to active state
    mockPrisma._store.trustedIssuers[ID.issuer1] = {
      id: ID.issuer1, issuerDid: 'did:key:z6MkAuditor1',
      issuerName: 'Auditor 1', credentialTypes: ['auditor'],
      active: true, revocationReason: null,
      activatedAt: new Date(), revokedAt: null, updatedAt: new Date(),
    };
  });

  // ── Auditor Assignment: Rotation Enforcement ────────────────────────────

  describe('Auditor Assignment - Rotation Enforcement', () => {
    it('should select auditors for a milestone', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/assign-auditor`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 2 },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.data).toHaveLength(2);
      expect(body.data[0]).toHaveProperty('auditorId');
      expect(body.data[0]).toHaveProperty('status', 'assigned');
      expect(body.data[0]).toHaveProperty('rotationRound');
    });

    it('should exclude already-assigned auditors from the same milestone', async () => {
      // First assignment: select 2
      const res1 = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/assign-auditor`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 2 },
      });
      expect(res1.statusCode).toBe(201);
      const first = res1.json().data;
      const firstIds = new Set(first.map((a: any) => a.auditorId));

      // Second assignment: select 1 more
      const res2 = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/assign-auditor`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 1 },
      });
      expect(res2.statusCode).toBe(201);
      const second = res2.json().data;
      // The new auditor should NOT be in the first set
      expect(firstIds.has(second[0].auditorId)).toBe(false);
    });

    it('should return error when not enough auditors available', async () => {
      // Request more auditors than exist (we have 3 non-conflict + 1 conflict = max 3 eligible)
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/assign-auditor`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 10 },
      });

      expect(res.statusCode).toBe(409);
      const body = res.json();
      expect(body.error.code).toBe('CONFLICT');
      expect(body.error.details).toHaveProperty('available');
      expect(body.error.details).toHaveProperty('requested', 10);
    });

    it('should enforce rotation: exclude auditors from recent rounds on same project', async () => {
      // Assign all 4 auditors (3 clean + 1 conflict but no attestations = no conflict detected)
      const res1 = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/assign-auditor`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 4 },
      });
      expect(res1.statusCode).toBe(201);
      expect(res1.json().data).toHaveLength(4);

      // Now try to assign 1 more - all 4 are assigned AND recent
      const res2 = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/assign-auditor`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 1 },
      });

      // Should fail because all auditors are excluded (assigned + rotation)
      expect(res2.statusCode).toBe(409);
    });
  });

  // ── Auditor Assignment: Conflict of Interest ──────────────────────────

  describe('Auditor Assignment - Conflict of Interest', () => {
    it('should exclude auditors from same organization as project contractors', async () => {
      // Set up attestation from contractor on the project to trigger conflict detection
      mockPrisma._store.attestations.push({
        id: randomUUID(), milestoneId: ID.milestone, actorId: ID.contractor,
        type: 'inspector_verification', status: 'submitted',
        _projectId: ID.project,
      });

      // Select all available auditors
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/assign-auditor`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 3 },
      });

      expect(res.statusCode).toBe(201);
      const assigned = res.json().data;
      const assignedIds = assigned.map((a: any) => a.auditorId);

      // auditorConflict shares org with contractor — should NOT be selected
      expect(assignedIds).not.toContain(ID.auditorConflict);
    });

    it('should allow auditors not in contractor org', async () => {
      mockPrisma._store.attestations.push({
        id: randomUUID(), milestoneId: ID.milestone, actorId: ID.contractor,
        type: 'inspector_verification', status: 'submitted',
        _projectId: ID.project,
      });

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/assign-auditor`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 1 },
      });

      expect(res.statusCode).toBe(201);
      const auditorId = res.json().data[0].auditorId;
      // Should be one of the non-conflict auditors
      expect([ID.auditor1, ID.auditor2, ID.auditor3]).toContain(auditorId);
    });
  });

  // ── Auditor Assignment: Fraud Revocation ──────────────────────────────

  describe('Auditor Assignment - Fraud Revocation', () => {
    it('should revoke credential via TrustedIssuerRegistry', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/auditors/${ID.auditor1}/revoke`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { reason: 'Verified fraud in milestone attestations' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual({ success: true });

      // Verify the trusted issuer was deactivated
      const issuer = mockPrisma._store.trustedIssuers[ID.issuer1];
      expect(issuer.active).toBe(false);
      expect(issuer.revocationReason).toBe('Verified fraud in milestone attestations');
    });

    it('should return 404 for unknown actor', async () => {
      const fakeId = '99999999-9999-9999-9999-999999999999';
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/auditors/${fakeId}/revoke`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { reason: 'Fraud detected' },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  // ── Citizen Pool Selection ────────────────────────────────────────────

  describe('Citizen Pool Selection', () => {
    it('should select citizens for a milestone', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/select-citizens`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 3 },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.data).toHaveLength(3);
      expect(body.data[0]).toHaveProperty('citizenId');
      expect(body.data[0]).toHaveProperty('status', 'enrolled');
      expect(body.data[0]).toHaveProperty('assuranceTier');
    });

    it('should not select already-enrolled citizens', async () => {
      // Select first batch
      const res1 = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/select-citizens`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 3 },
      });
      expect(res1.statusCode).toBe(201);
      const firstIds = new Set(res1.json().data.map((p: any) => p.citizenId));

      // Select second batch
      const res2 = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/select-citizens`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 3 },
      });
      expect(res2.statusCode).toBe(201);
      const secondIds = res2.json().data.map((p: any) => p.citizenId);

      // No overlap between batches
      for (const id of secondIds) {
        expect(firstIds.has(id)).toBe(false);
      }
    });

    it('should return error when not enough citizens available', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/select-citizens`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 100 },
      });

      expect(res.statusCode).toBe(409);
      const body = res.json();
      expect(body.error.code).toBe('CONFLICT');
      expect(body.error.details).toHaveProperty('available');
      expect(body.error.details).toHaveProperty('requested', 100);
    });

    it('should return 404 for non-existent milestone', async () => {
      const fakeId = '99999999-9999-9999-9999-999999999999';
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${fakeId}/select-citizens`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 3 },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  // ── Citizen Pool: SIM Cap Enforcement ─────────────────────────────────

  describe('Citizen Pool - SIM Cap Enforcement', () => {
    it('should exclude citizens at maximum active enrollments (5)', async () => {
      // Give citizen1 exactly 5 active enrollments on other milestones
      for (let i = 0; i < 5; i++) {
        const otherMilestone = randomUUID();
        mockPrisma._store.citizenPools.push({
          id: randomUUID(), milestoneId: otherMilestone, citizenId: ID.citizen1,
          proximityProofHash: '0'.repeat(64), assuranceTier: 'biometric',
          status: 'enrolled', enrolledAt: new Date(), updatedAt: new Date(),
        });
      }

      // Select 7 citizens — citizen1 should be excluded (SIM cap)
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/select-citizens`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 6 },
      });

      expect(res.statusCode).toBe(201);
      const selectedIds = res.json().data.map((p: any) => p.citizenId);
      expect(selectedIds).not.toContain(ID.citizen1);
      expect(selectedIds).toHaveLength(6);
    });

    it('should allow citizens under the SIM cap', async () => {
      // Give citizen2 exactly 4 active enrollments (under cap of 5)
      for (let i = 0; i < 4; i++) {
        mockPrisma._store.citizenPools.push({
          id: randomUUID(), milestoneId: randomUUID(), citizenId: ID.citizen2,
          proximityProofHash: '0'.repeat(64), assuranceTier: 'ussd',
          status: 'enrolled', enrolledAt: new Date(), updatedAt: new Date(),
        });
      }

      // Select citizens — citizen2 should still be eligible
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/select-citizens`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 7 },
      });

      expect(res.statusCode).toBe(201);
      const selectedIds = res.json().data.map((p: any) => p.citizenId);
      expect(selectedIds).toContain(ID.citizen2);
    });
  });

  // ── Citizen Pool: Stratification ──────────────────────────────────────

  describe('Citizen Pool - Tier Stratification', () => {
    it('should produce balanced tier distribution across multiple selections', async () => {
      // Pre-seed tier info for citizens by giving them existing enrollments with different tiers
      const tiers = ['biometric', 'ussd', 'cso_mediated', 'biometric', 'ussd', 'cso_mediated', 'biometric'];
      const citizenIds = [ID.citizen1, ID.citizen2, ID.citizen3, ID.citizen4, ID.citizen5, ID.citizen6, ID.citizen7];

      for (let i = 0; i < citizenIds.length; i++) {
        const otherMilestone = randomUUID();
        mockPrisma._store.citizenPools.push({
          id: randomUUID(), milestoneId: otherMilestone, citizenId: citizenIds[i],
          proximityProofHash: '0'.repeat(64), assuranceTier: tiers[i],
          status: 'withdrawn', // withdrawn so they're not counted as active
          enrolledAt: new Date(), updatedAt: new Date(),
        });
      }

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/select-citizens`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 6 },
      });

      expect(res.statusCode).toBe(201);
      const pools = res.json().data;
      expect(pools).toHaveLength(6);

      // Count tier distribution
      const tierCounts: Record<string, number> = {};
      for (const p of pools) {
        tierCounts[p.assuranceTier] = (tierCounts[p.assuranceTier] ?? 0) + 1;
      }

      // With round-robin stratification, each tier should get ~2 of 6
      // At minimum, no single tier should have all 6
      const maxTierCount = Math.max(...Object.values(tierCounts));
      expect(maxTierCount).toBeLessThanOrEqual(4);
    });
  });

  // ── Randomness Distribution ───────────────────────────────────────────

  describe('Randomness Distribution', () => {
    it('should produce different selections over multiple runs', async () => {
      const selectionSets: string[][] = [];

      for (let run = 0; run < 10; run++) {
        // Clear pools between runs
        mockPrisma._store.citizenPools.length = 0;

        const res = await app.inject({
          method: 'POST',
          url: `/api/v1/milestones/${ID.milestone}/select-citizens`,
          headers: { authorization: `Bearer ${adminToken(app)}` },
          payload: { count: 3 },
        });

        expect(res.statusCode).toBe(201);
        const ids = res.json().data.map((p: any) => p.citizenId).sort();
        selectionSets.push(ids);
      }

      // Check that not all 10 runs produced the exact same set
      const uniqueSets = new Set(selectionSets.map((s) => s.join(',')));
      // With 7 citizens choosing 3, there are C(7,3)=35 possible sets
      // Probability of all 10 identical = (1/35)^9 ≈ 0 — virtually impossible
      expect(uniqueSets.size).toBeGreaterThan(1);
    });
  });

  // ── Auth Edge Cases ───────────────────────────────────────────────────

  describe('Auth Edge Cases', () => {
    it('should return 401 without auth token on assign-auditor', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/assign-auditor`,
        payload: { count: 1 },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should return 401 without auth token on select-citizens', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/select-citizens`,
        payload: { count: 3 },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should require admin role for assign-auditor', async () => {
      const citizenToken = app.jwt.sign({
        sub: 'did:key:z6MkCitizen', did: 'did:key:z6MkCitizen',
        roles: ['citizen'], actorId: ID.citizen1,
      });

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/assign-auditor`,
        headers: { authorization: `Bearer ${citizenToken}` },
        payload: { count: 1 },
      });

      expect(res.statusCode).toBe(403);
    });

    it('should require admin role for select-citizens', async () => {
      const auditorToken = app.jwt.sign({
        sub: 'did:key:z6MkAuditor', did: 'did:key:z6MkAuditor',
        roles: ['independent_auditor'], actorId: ID.auditor1,
      });

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/select-citizens`,
        headers: { authorization: `Bearer ${auditorToken}` },
        payload: { count: 3 },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  // ── Audit Logging ─────────────────────────────────────────────────────

  describe('Audit Logging', () => {
    it('should log selection rationale for auditor assignment', async () => {
      const callCountBefore = mockPrisma.auditLog.create.mock.calls.length;

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/assign-auditor`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 2 },
      });

      expect(res.statusCode).toBe(201);
      // Audit log should have been called at least once
      expect(mockPrisma.auditLog.create.mock.calls.length).toBeGreaterThan(callCountBefore);
      const lastCall = mockPrisma.auditLog.create.mock.calls.at(-1)?.[0];
      expect(lastCall.data.entityType).toBe('AuditorAssignment');
      expect(lastCall.data.action).toBe('assign');
      // payloadHash is a SHA-256 of the JSON-serialized payload
      expect(lastCall.data.payloadHash).toBeDefined();
    });

    it('should log selection rationale for citizen pool selection', async () => {
      const callCountBefore = mockPrisma.auditLog.create.mock.calls.length;

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/milestones/${ID.milestone}/select-citizens`,
        headers: { authorization: `Bearer ${adminToken(app)}` },
        payload: { count: 3 },
      });

      expect(res.statusCode).toBe(201);
      expect(mockPrisma.auditLog.create.mock.calls.length).toBeGreaterThan(callCountBefore);
      const lastCall = mockPrisma.auditLog.create.mock.calls.at(-1)?.[0];
      expect(lastCall.data.entityType).toBe('CitizenPool');
      expect(lastCall.data.action).toBe('assign');
      expect(lastCall.data.payloadHash).toBeDefined();
    });
  });
});

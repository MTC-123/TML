import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { errorHandler } from './middleware/error-handler.js';
import { attestationRoutes } from './routes/attestations.routes.js';
import { milestoneAttestationRoutes } from './routes/milestone-attestations.routes.js';

// ── Mock @tml/crypto FIRST ──────────────────────────────────────────────────

vi.mock('@tml/crypto', () => ({
  sha256Hex: vi.fn().mockReturnValue('0'.repeat(64)),
  verifyAttestation: vi.fn().mockReturnValue(true),
  generateCertificate: vi.fn().mockReturnValue({
    certificateHash: 'mock-cert-hash-' + 'a'.repeat(50),
    digitalSignature: 'mock-cert-sig',
    milestoneId: 'will-be-overridden',
    projectId: 'will-be-overridden',
    attestations: [],
    issuedAt: new Date().toISOString(),
  }),
  verifyPayload: vi.fn().mockReturnValue(true),
  keyPairFromPrivateKey: vi.fn().mockReturnValue({
    publicKey: new Uint8Array(32),
    privateKey: new Uint8Array(64),
  }),
  InvalidSignatureError: class InvalidSignatureError extends Error {
    code = 'INVALID_SIGNATURE';
    details = {};
  },
  ExpiredCredentialError: class ExpiredCredentialError extends Error {
    code = 'EXPIRED_CREDENTIAL';
    details = {};
  },
  TamperedDataError: class TamperedDataError extends Error {
    code = 'TAMPERED_DATA';
    details = {};
  },
  MalformedDIDError: class MalformedDIDError extends Error {
    code = 'MALFORMED_DID';
    details = {};
  },
  CryptoError: class CryptoError extends Error {
    code = 'CRYPTO_ERROR';
    details = {};
  },
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

// ── Stable UUIDs for all entities ───────────────────────────────────────────

const ID = {
  projectGeo: '10000000-0000-0000-0000-000000000001',
  projectNoGeo: '10000000-0000-0000-0000-000000000002',
  milestoneGeo: '20000000-0000-0000-0000-000000000001',
  milestoneNoGeo: '20000000-0000-0000-0000-000000000002',
  inspector: '30000000-0000-0000-0000-000000000001',
  auditor: '30000000-0000-0000-0000-000000000002',
  citizen1: '30000000-0000-0000-0000-000000000003',
  citizen2: '30000000-0000-0000-0000-000000000004',
  citizen3: '30000000-0000-0000-0000-000000000005',
  citizen4: '30000000-0000-0000-0000-000000000006',
} as const;

// ── Mock Prisma Factory ─────────────────────────────────────────────────────

function createMockPrisma() {
  const actors: Record<string, any> = {
    [ID.inspector]: {
      id: ID.inspector,
      did: 'did:key:z6MkInspector',
      cnieHash: 'a'.repeat(64),
      roles: ['contractor_engineer'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    [ID.auditor]: {
      id: ID.auditor,
      did: 'did:key:z6MkAuditor',
      cnieHash: 'b'.repeat(64),
      roles: ['independent_auditor'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    [ID.citizen1]: {
      id: ID.citizen1,
      did: 'did:key:z6MkCitizen1',
      cnieHash: 'c'.repeat(64),
      roles: ['citizen'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    [ID.citizen2]: {
      id: ID.citizen2,
      did: 'did:key:z6MkCitizen2',
      cnieHash: 'd'.repeat(64),
      roles: ['citizen'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    [ID.citizen3]: {
      id: ID.citizen3,
      did: 'did:key:z6MkCitizen3',
      cnieHash: 'e'.repeat(64),
      roles: ['citizen'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    [ID.citizen4]: {
      id: ID.citizen4,
      did: 'did:key:z6MkCitizen4',
      cnieHash: 'f'.repeat(64),
      roles: ['citizen'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const projects: Record<string, any> = {
    [ID.projectGeo]: {
      id: ID.projectGeo,
      name: 'Geo Project',
      region: 'Fes-Meknes',
      budget: { toString: () => '1000000.00' },
      donor: null,
      status: 'active',
      boundary: [
        { lat: 33.52, lng: -5.12 },
        { lat: 33.55, lng: -5.12 },
        { lat: 33.55, lng: -5.08 },
        { lat: 33.52, lng: -5.08 },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    [ID.projectNoGeo]: {
      id: ID.projectNoGeo,
      name: 'No Geo Project',
      region: 'Rabat',
      budget: { toString: () => '500000.00' },
      donor: null,
      status: 'active',
      boundary: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  };

  const milestones: Record<string, any> = {
    [ID.milestoneGeo]: {
      id: ID.milestoneGeo,
      projectId: ID.projectGeo,
      sequenceNumber: 1,
      description: 'Foundation',
      deadline: new Date('2026-12-31'),
      status: 'attestation_in_progress',
      requiredInspectorCount: 1,
      requiredAuditorCount: 1,
      requiredCitizenCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    [ID.milestoneNoGeo]: {
      id: ID.milestoneNoGeo,
      projectId: ID.projectNoGeo,
      sequenceNumber: 1,
      description: 'Foundation No Geo',
      deadline: new Date('2026-12-31'),
      status: 'attestation_in_progress',
      requiredInspectorCount: 1,
      requiredAuditorCount: 1,
      requiredCitizenCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  };

  let attestations: any[] = [];

  const auditorAssignments: Record<string, any> = {
    [`${ID.milestoneGeo}_${ID.auditor}`]: {
      id: randomUUID(),
      milestoneId: ID.milestoneGeo,
      auditorId: ID.auditor,
      rotationRound: 1,
      conflictDeclared: false,
      conflictReason: null,
      status: 'accepted',
      assignedAt: new Date(),
      updatedAt: new Date(),
    },
    [`${ID.milestoneNoGeo}_${ID.auditor}`]: {
      id: randomUUID(),
      milestoneId: ID.milestoneNoGeo,
      auditorId: ID.auditor,
      rotationRound: 1,
      conflictDeclared: false,
      conflictReason: null,
      status: 'accepted',
      assignedAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const citizenPools: Record<string, any> = {};
  for (const msId of [ID.milestoneGeo, ID.milestoneNoGeo]) {
    const tiers = ['biometric', 'ussd', 'cso_mediated', 'biometric'] as const;
    const citizenIds = [ID.citizen1, ID.citizen2, ID.citizen3, ID.citizen4];
    for (let i = 0; i < citizenIds.length; i++) {
      const key = `${msId}_${citizenIds[i]}`;
      citizenPools[key] = {
        id: randomUUID(),
        milestoneId: msId,
        citizenId: citizenIds[i],
        proximityProofHash: String.fromCharCode(97 + i).repeat(64),
        assuranceTier: tiers[i],
        status: 'enrolled',
        enrolledAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  const certificates: Record<string, any> = {};

  return {
    _store: { projects, milestones, attestations, actors, auditorAssignments, citizenPools, certificates },
    _resetAttestations() {
      attestations.length = 0;
    },

    actor: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id) return actors[where.id] ?? null;
        if (where.did) return Object.values(actors).find((a: any) => a.did === where.did) ?? null;
        return null;
      }),
    },

    project: {
      findUnique: vi.fn(async ({ where }: any) => {
        return projects[where.id] ?? null;
      }),
    },

    milestone: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id) return milestones[where.id] ?? null;
        return null;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const m = milestones[where.id];
        if (!m) throw new Error('Not found');
        const updated = { ...m, ...data, updatedAt: new Date() };
        milestones[where.id] = updated;
        return updated;
      }),
    },

    attestation: {
      create: vi.fn(async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const attestation = {
          id,
          milestoneId: data.milestoneId,
          actorId: data.actorId,
          type: data.type,
          evidenceHash: data.evidenceHash,
          gpsLatitude: { toString: () => data.gpsLatitude },
          gpsLongitude: { toString: () => data.gpsLongitude },
          deviceAttestationToken: data.deviceAttestationToken,
          digitalSignature: data.digitalSignature,
          status: 'submitted',
          submittedAt: now,
          revokedAt: null,
        };
        attestations.push(attestation);
        return attestation;
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id) {
          return attestations.find((a: any) => a.id === where.id) ?? null;
        }
        if (where.milestoneId_actorId_type) {
          const { milestoneId, actorId, type } = where.milestoneId_actorId_type;
          return attestations.find(
            (a: any) =>
              a.milestoneId === milestoneId &&
              a.actorId === actorId &&
              a.type === type,
          ) ?? null;
        }
        return null;
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        return attestations.find((a: any) => {
          if (where.milestoneId && a.milestoneId !== where.milestoneId) return false;
          if (where.deviceAttestationToken && a.deviceAttestationToken !== where.deviceAttestationToken) return false;
          if (where.type && a.type !== where.type) return false;
          if (where.status?.in && !where.status.in.includes(a.status)) return false;
          return true;
        }) ?? null;
      }),
      findMany: vi.fn(async ({ where, skip, take, orderBy }: any = {}) => {
        let results = attestations.filter((a: any) => {
          if (where?.milestoneId && a.milestoneId !== where.milestoneId) return false;
          if (where?.type && a.type !== where.type) return false;
          if (where?.status?.in && !where.status.in.includes(a.status)) return false;
          return true;
        });
        if (orderBy?.submittedAt === 'desc') {
          results.sort((a: any, b: any) => b.submittedAt.getTime() - a.submittedAt.getTime());
        }
        if (skip !== undefined) results = results.slice(skip);
        if (take !== undefined) results = results.slice(0, take);
        return results;
      }),
      groupBy: vi.fn(async ({ where }: any) => {
        const filtered = attestations.filter((a: any) => {
          if (where?.milestoneId && a.milestoneId !== where.milestoneId) return false;
          return true;
        });
        const groups: Record<string, any> = {};
        for (const a of filtered) {
          const key = `${a.type}__${a.status}`;
          if (!groups[key]) {
            groups[key] = { type: a.type, status: a.status, _count: { id: 0 } };
          }
          groups[key]._count.id++;
        }
        return Object.values(groups);
      }),
      count: vi.fn(async ({ where }: any = {}) => {
        return attestations.filter((a: any) => {
          if (where?.milestoneId && a.milestoneId !== where.milestoneId) return false;
          return true;
        }).length;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const idx = attestations.findIndex((a: any) => a.id === where.id);
        if (idx === -1) throw new Error('Not found');
        attestations[idx] = { ...attestations[idx], ...data, updatedAt: new Date() };
        return attestations[idx];
      }),
    },

    auditorAssignment: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.milestoneId_auditorId) {
          const key = `${where.milestoneId_auditorId.milestoneId}_${where.milestoneId_auditorId.auditorId}`;
          return auditorAssignments[key] ?? null;
        }
        if (where.id) {
          return Object.values(auditorAssignments).find((a: any) => a.id === where.id) ?? null;
        }
        return null;
      }),
    },

    citizenPool: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.milestoneId_citizenId) {
          const key = `${where.milestoneId_citizenId.milestoneId}_${where.milestoneId_citizenId.citizenId}`;
          return citizenPools[key] ?? null;
        }
        if (where.id) {
          return Object.values(citizenPools).find((p: any) => p.id === where.id) ?? null;
        }
        return null;
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return Object.values(citizenPools).filter((p: any) => {
          if (where?.milestoneId && p.milestoneId !== where.milestoneId) return false;
          if (where?.citizenId?.in && !where.citizenId.in.includes(p.citizenId)) return false;
          return true;
        });
      }),
    },

    complianceCertificate: {
      create: vi.fn(async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const cert = {
          id,
          milestoneId: data.milestoneId,
          certificateHash: data.certificateHash,
          digitalSignature: data.digitalSignature,
          status: data.status,
          tgrReference: null,
          revocationReason: null,
          issuedAt: now,
          revokedAt: null,
        };
        certificates[id] = cert;
        certificates[`ms_${data.milestoneId}`] = cert;
        return cert;
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id) return certificates[where.id] ?? null;
        if (where.milestoneId) return certificates[`ms_${where.milestoneId}`] ?? null;
        if (where.certificateHash) {
          return Object.values(certificates).find((c: any) => c.certificateHash === where.certificateHash) ?? null;
        }
        return null;
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        if (where?.milestoneId) return certificates[`ms_${where.milestoneId}`] ?? null;
        return null;
      }),
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

  await app.register(attestationRoutes, { prefix: '/api/v1/attestations' });
  await app.register(milestoneAttestationRoutes, { prefix: '/api/v1/milestones' });

  await app.ready();
  return app;
}

// ── JWT helpers ─────────────────────────────────────────────────────────────

function signToken(app: FastifyInstance, payload: Record<string, unknown>): string {
  return app.jwt.sign(payload);
}

function inspectorToken(app: FastifyInstance): string {
  return signToken(app, {
    sub: 'did:key:z6MkInspector',
    did: 'did:key:z6MkInspector',
    roles: ['contractor_engineer'],
    actorId: ID.inspector,
  });
}

function auditorToken(app: FastifyInstance): string {
  return signToken(app, {
    sub: 'did:key:z6MkAuditor',
    did: 'did:key:z6MkAuditor',
    roles: ['independent_auditor'],
    actorId: ID.auditor,
  });
}

function citizenToken(app: FastifyInstance, n: number): string {
  const citizenIds = [ID.citizen1, ID.citizen2, ID.citizen3, ID.citizen4];
  const citizenId = citizenIds[n - 1];
  return signToken(app, {
    sub: `did:key:z6MkCitizen${n}`,
    did: `did:key:z6MkCitizen${n}`,
    roles: ['citizen'],
    actorId: citizenId,
  });
}

function adminToken(app: FastifyInstance): string {
  return signToken(app, {
    sub: 'did:key:z6MkAdmin',
    did: 'did:key:z6MkAdmin',
    roles: ['admin'],
    actorId: 'actor-admin',
  });
}

// ── Test body helper ────────────────────────────────────────────────────────

function makeAttestationBody(overrides: Record<string, any> = {}) {
  return {
    actorId: ID.inspector,
    type: 'inspector_verification',
    evidenceHash: 'a'.repeat(64),
    gpsLatitude: '33.5300000',
    gpsLongitude: '-5.1050000',
    deviceAttestationToken: 'device-token-1',
    digitalSignature: 'sig-placeholder',
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

// ── 1. Geofence validation ──────────────────────────────────────────────────

describe('Attestations — Geofence validation', () => {
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
    mockPrisma._resetAttestations();
  });

  it('GPS inside boundary returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody({
        gpsLatitude: '33.5300000',
        gpsLongitude: '-5.1050000',
      }),
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBeDefined();
    expect(body.milestoneId).toBe(ID.milestoneGeo);
    expect(body.status).toBe('submitted');
  });

  it('GPS outside boundary returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody({
        gpsLatitude: '40.0000000',
        gpsLongitude: '-5.1050000',
      }),
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toMatch(/geofence/i);
  });

  it('null boundary skips geofence check and returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneNoGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody({
        gpsLatitude: '40.0000000',
        gpsLongitude: '-5.1050000',
      }),
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.milestoneId).toBe(ID.milestoneNoGeo);
  });
});

// ── 2. Attestation ordering ─────────────────────────────────────────────────

describe('Attestations — Ordering rules', () => {
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
    mockPrisma._resetAttestations();
  });

  it('auditor review without inspector returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${auditorToken(app)}` },
      payload: makeAttestationBody({
        actorId: ID.auditor,
        type: 'auditor_review',
        deviceAttestationToken: 'device-auditor-1',
      }),
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toMatch(/inspector/i);
  });

  it('auditor review with inspector present returns 201', async () => {
    // First add an inspector attestation
    const inspRes = await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody(),
    });
    expect(inspRes.statusCode).toBe(201);

    // Now auditor should succeed
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${auditorToken(app)}` },
      payload: makeAttestationBody({
        actorId: ID.auditor,
        type: 'auditor_review',
        deviceAttestationToken: 'device-auditor-1',
      }),
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().type).toBe('auditor_review');
  });

  it('citizen approval without auditor returns 400', async () => {
    // Only add inspector, no auditor
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody(),
    });

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 1)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen1,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-citizen-1',
      }),
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toMatch(/auditor/i);
  });

  it('citizen approval with auditor present returns 201', async () => {
    // Add inspector
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody(),
    });

    // Add auditor
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${auditorToken(app)}` },
      payload: makeAttestationBody({
        actorId: ID.auditor,
        type: 'auditor_review',
        deviceAttestationToken: 'device-auditor-1',
      }),
    });

    // Citizen should succeed
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 1)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen1,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-citizen-1',
      }),
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().type).toBe('citizen_approval');
  });
});

// ── 3. Duplicate prevention ─────────────────────────────────────────────────

describe('Attestations — Duplicate prevention', () => {
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
    mockPrisma._resetAttestations();
  });

  it('same actor+type on same milestone returns 409', async () => {
    // First submission
    const res1 = await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody(),
    });
    expect(res1.statusCode).toBe(201);

    // Duplicate
    const res2 = await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody({
        deviceAttestationToken: 'device-token-2',
      }),
    });
    expect(res2.statusCode).toBe(409);
    expect(res2.json().error.code).toBe('CONFLICT');
  });

  it('same device token for citizen on same milestone returns 409', async () => {
    // Seed inspector + auditor first for ordering
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody(),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${auditorToken(app)}` },
      payload: makeAttestationBody({
        actorId: ID.auditor,
        type: 'auditor_review',
        deviceAttestationToken: 'device-auditor-1',
      }),
    });

    // First citizen
    const res1 = await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 1)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen1,
        type: 'citizen_approval',
        deviceAttestationToken: 'shared-device-token',
      }),
    });
    expect(res1.statusCode).toBe(201);

    // Second citizen with same device token
    const res2 = await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 2)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen2,
        type: 'citizen_approval',
        deviceAttestationToken: 'shared-device-token',
      }),
    });
    expect(res2.statusCode).toBe(409);
    expect(res2.json().error.code).toBe('CONFLICT');
  });
});

// ── 4. Weighted quorum ──────────────────────────────────────────────────────

describe('Attestations — Weighted quorum', () => {
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
    mockPrisma._resetAttestations();
    // Reset milestone status in case a prior test triggered auto-finalization
    mockPrisma._store.milestones[ID.milestoneGeo].status = 'attestation_in_progress';
    mockPrisma._store.milestones[ID.milestoneNoGeo].status = 'attestation_in_progress';
  });

  it('mixed tiers scored correctly', async () => {
    // Add inspector + auditor + 3 citizens (biometric, ussd, cso_mediated)
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody(),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${auditorToken(app)}` },
      payload: makeAttestationBody({
        actorId: ID.auditor,
        type: 'auditor_review',
        deviceAttestationToken: 'device-auditor-1',
      }),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 1)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen1,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c1',
      }),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 2)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen2,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c2',
      }),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 3)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen3,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c3',
      }),
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/milestones/${ID.milestoneGeo}/quorum`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    // biometric(1.0) + ussd(0.6) + cso_mediated(0.4) = 2.0
    expect(body.citizen.weightedScore).toBe(2);
    expect(body.citizen.breakdown).toHaveLength(3);
  });

  it('threshold boundary: weightedScore equals required means met is true', async () => {
    // Add inspector + auditor + 4 citizens to reach exactly 3.0
    // citizen-1 biometric=1.0, citizen-4 biometric=1.0, citizen-2 ussd=0.6, citizen-3 cso_mediated=0.4
    // Total = 1.0 + 1.0 + 0.6 + 0.4 = 3.0 exactly
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody(),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${auditorToken(app)}` },
      payload: makeAttestationBody({
        actorId: ID.auditor,
        type: 'auditor_review',
        deviceAttestationToken: 'device-auditor-1',
      }),
    });

    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 1)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen1,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c1',
      }),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 4)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen4,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c4',
      }),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 2)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen2,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c2',
      }),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 3)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen3,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c3',
      }),
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/milestones/${ID.milestoneGeo}/quorum`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.citizen.weightedScore).toBe(3);
    expect(body.citizen.met).toBe(true);
  });

  it('revoked attestations not counted in quorum', async () => {
    // Add inspector + auditor
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody(),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${auditorToken(app)}` },
      payload: makeAttestationBody({
        actorId: ID.auditor,
        type: 'auditor_review',
        deviceAttestationToken: 'device-auditor-1',
      }),
    });

    // Add a citizen attestation
    const res1 = await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 1)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen1,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c1',
      }),
    });
    expect(res1.statusCode).toBe(201);

    // Manually revoke it in the store
    const attestationId = res1.json().id;
    const att = mockPrisma._store.attestations.find((a: any) => a.id === attestationId);
    if (att) att.status = 'revoked';

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/milestones/${ID.milestoneGeo}/quorum`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.citizen.weightedScore).toBe(0);
    expect(body.citizen.breakdown).toHaveLength(0);
  });

  it('per-tier weights are correct: biometric=1.0, ussd=0.6, cso_mediated=0.4', async () => {
    // Add inspector + auditor
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody(),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${auditorToken(app)}` },
      payload: makeAttestationBody({
        actorId: ID.auditor,
        type: 'auditor_review',
        deviceAttestationToken: 'device-auditor-1',
      }),
    });

    // One citizen of each tier
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 1)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen1,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c1',
      }),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 2)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen2,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c2',
      }),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 3)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen3,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c3',
      }),
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/milestones/${ID.milestoneGeo}/quorum`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    const breakdown = body.citizen.breakdown;

    const biometricEntry = breakdown.find((b: any) => b.actorId === ID.citizen1);
    const ussdEntry = breakdown.find((b: any) => b.actorId === ID.citizen2);
    const csoEntry = breakdown.find((b: any) => b.actorId === ID.citizen3);

    expect(biometricEntry.assuranceTier).toBe('biometric');
    expect(biometricEntry.weight).toBe(1.0);
    expect(ussdEntry.assuranceTier).toBe('ussd');
    expect(ussdEntry.weight).toBe(0.6);
    expect(csoEntry.assuranceTier).toBe('cso_mediated');
    expect(csoEntry.weight).toBe(0.4);
  });

  it('example: 2 biometric (2.0) + 1 ussd (0.6) = 2.6', async () => {
    // Add inspector + auditor
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody(),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${auditorToken(app)}` },
      payload: makeAttestationBody({
        actorId: ID.auditor,
        type: 'auditor_review',
        deviceAttestationToken: 'device-auditor-1',
      }),
    });

    // citizen-1 biometric
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 1)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen1,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c1',
      }),
    });
    // citizen-4 biometric
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 4)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen4,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c4',
      }),
    });
    // citizen-2 ussd
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 2)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen2,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c2',
      }),
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/milestones/${ID.milestoneGeo}/quorum`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.citizen.weightedScore).toBe(2.6);
  });
});

// ── 5. Full chain ───────────────────────────────────────────────────────────

describe('Attestations — Full chain', () => {
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
    mockPrisma._resetAttestations();
    // Reset milestone status back to attestation_in_progress
    mockPrisma._store.milestones[ID.milestoneGeo].status = 'attestation_in_progress';
    // Clear certificates
    for (const key of Object.keys(mockPrisma._store.certificates)) {
      delete mockPrisma._store.certificates[key];
    }
  });

  it('complete chain: inspector + auditor + 4 citizens triggers certificate and milestone completion', async () => {
    // Inspector
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody(),
    });

    // Auditor
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${auditorToken(app)}` },
      payload: makeAttestationBody({
        actorId: ID.auditor,
        type: 'auditor_review',
        deviceAttestationToken: 'device-auditor-1',
      }),
    });

    // 4 citizens: biometric(1.0) + biometric(1.0) + ussd(0.6) + cso_mediated(0.4) = 3.0 >= requiredCitizenCount(3)
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 1)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen1,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c1',
      }),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 4)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen4,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c4',
      }),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 2)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen2,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c2',
      }),
    });
    const lastRes = await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 3)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen3,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c3',
      }),
    });
    expect(lastRes.statusCode).toBe(201);

    // Milestone should have been set to 'completed' by checkAndFinalizeQuorum
    expect(mockPrisma._store.milestones[ID.milestoneGeo].status).toBe('completed');

    // Certificate should have been created
    const certKeys = Object.keys(mockPrisma._store.certificates);
    expect(certKeys.length).toBeGreaterThan(0);
  });

  it('incomplete quorum (only inspector) does not trigger certificate', async () => {
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody(),
    });

    expect(mockPrisma._store.milestones[ID.milestoneGeo].status).toBe('attestation_in_progress');
    expect(Object.keys(mockPrisma._store.certificates).length).toBe(0);
  });

  it('partial citizens (below threshold) does not trigger certificate', async () => {
    // Inspector
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody(),
    });

    // Auditor
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${auditorToken(app)}` },
      payload: makeAttestationBody({
        actorId: ID.auditor,
        type: 'auditor_review',
        deviceAttestationToken: 'device-auditor-1',
      }),
    });

    // Only 1 citizen (need 3)
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${citizenToken(app, 1)}` },
      payload: makeAttestationBody({
        actorId: ID.citizen1,
        type: 'citizen_approval',
        deviceAttestationToken: 'device-c1',
      }),
    });

    expect(mockPrisma._store.milestones[ID.milestoneGeo].status).toBe('attestation_in_progress');
    expect(Object.keys(mockPrisma._store.certificates).length).toBe(0);
  });
});

// ── 6. Milestone-scoped routes ──────────────────────────────────────────────

describe('Attestations — Milestone-scoped routes', () => {
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
    mockPrisma._resetAttestations();
  });

  it('POST /:id/attestations creates attestation with milestoneId from URL', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody(),
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().milestoneId).toBe(ID.milestoneGeo);
  });

  it('GET /:id/attestations returns attestations for that milestone', async () => {
    // Seed an attestation
    await app.inject({
      method: 'POST',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
      payload: makeAttestationBody(),
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/milestones/${ID.milestoneGeo}/attestations?page=1&limit=10`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBe(1);
    expect(body.pagination).toBeDefined();
  });

  it('GET /:id/quorum returns breakdown', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/milestones/${ID.milestoneGeo}/quorum`,
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.milestoneId).toBe(ID.milestoneGeo);
    expect(body.inspector).toBeDefined();
    expect(body.auditor).toBeDefined();
    expect(body.citizen).toBeDefined();
    expect(typeof body.overallMet).toBe('boolean');
  });
});

// ── 7. Auth edge cases ──────────────────────────────────────────────────────

describe('Attestations — Auth edge cases', () => {
  let app: FastifyInstance;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeAll(async () => {
    mockPrisma = createMockPrisma();
    app = await buildTestApp(mockPrisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without token on quorum endpoint', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/milestones/${ID.milestoneGeo}/quorum`,
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('UNAUTHORIZED');
  });

  it('404 for non-existent milestone on quorum endpoint', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/milestones/00000000-0000-0000-0000-000000000000/quorum',
      headers: { authorization: `Bearer ${inspectorToken(app)}` },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });
});

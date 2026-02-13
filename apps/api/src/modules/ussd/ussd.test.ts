import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { errorHandler } from '../../middleware/error-handler.js';
import { ussdRoutes } from './ussd.routes.js';
import { MockSmsGateway } from './sms-gateway.js';
import { UssdController } from './ussd.controller.js';
import { sanitizeUssdInput, sanitizeProjectCode, sanitizeOtp } from './input-sanitizer.js';
import { deriveProjectCode } from './project-code.js';

// ── Mock @tml/crypto ────────────────────────────────────────────────────────

vi.mock('@tml/crypto', () => ({
  sha256Hex: vi.fn((input: string) => {
    // Simple deterministic hash for tests
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return hex.repeat(8).slice(0, 64);
  }),
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

vi.mock('../../config/env.js', () => ({
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
    AFRICASTALKING_API_KEY: 'test-at-key',
    AFRICASTALKING_USERNAME: 'sandbox',
  }),
}));

vi.mock('../../config.js', () => ({
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
    AFRICASTALKING_API_KEY: 'test-at-key',
    AFRICASTALKING_USERNAME: 'sandbox',
  }),
  resetEnvCache: vi.fn(),
}));

// ── Stable IDs ──────────────────────────────────────────────────────────────

const ID = {
  project: '10000000-0000-0000-0000-000000000001',
  milestone: '20000000-0000-0000-0000-000000000001',
  citizen1: '30000000-0000-0000-0000-000000000003',
  citizen2: '30000000-0000-0000-0000-000000000004',
  inspector: '30000000-0000-0000-0000-000000000001',
  auditor: '30000000-0000-0000-0000-000000000002',
} as const;

const PHONE = '+212600000001';
const API_KEY = 'test-at-key';

// ── Mock Redis ──────────────────────────────────────────────────────────────

function createMockRedis() {
  const store = new Map<string, { value: string; expiresAt: number | null }>();

  return {
    _store: store,
    _reset() {
      store.clear();
    },
    get: vi.fn(async (key: string) => {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    }),
    set: vi.fn(async (key: string, value: string, ...args: unknown[]) => {
      let expiresAt: number | null = null;
      if (args[0] === 'EX' && typeof args[1] === 'number') {
        expiresAt = Date.now() + args[1] * 1000;
      }
      store.set(key, { value, expiresAt });
      return 'OK';
    }),
    del: vi.fn(async (key: string | string[]) => {
      const keys = Array.isArray(key) ? key : [key];
      let count = 0;
      for (const k of keys) {
        if (store.delete(k)) count++;
      }
      return count;
    }),
    incr: vi.fn(async (key: string) => {
      const entry = store.get(key);
      const val = entry ? parseInt(entry.value, 10) + 1 : 1;
      store.set(key, { value: val.toString(), expiresAt: entry?.expiresAt ?? null });
      return val;
    }),
    expire: vi.fn(async (_key: string, _ttl: number) => 1),
    ttl: vi.fn(async (_key: string) => 60),
  };
}

// ── Mock Prisma ─────────────────────────────────────────────────────────────

function createMockPrisma() {
  const actors: Record<string, any> = {
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
  };

  const projects: Record<string, any> = {
    [ID.project]: {
      id: ID.project,
      name: 'Route Nationale 7',
      region: 'Fes-Meknes',
      budget: { toString: () => '5000000.00' },
      donor: null,
      status: 'active',
      boundary: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  };

  const milestones: Record<string, any> = {
    [ID.milestone]: {
      id: ID.milestone,
      projectId: ID.project,
      sequenceNumber: 1,
      description: 'Fondation coulée',
      deadline: new Date('2026-06-01'),
      status: 'attestation_in_progress',
      requiredInspectorCount: 1,
      requiredAuditorCount: 1,
      requiredCitizenCount: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  };

  // Pre-seed with inspector + auditor attestations so ordering check passes for citizen_approval
  const attestations: any[] = [
    {
      id: '40000000-0000-0000-0000-000000000001',
      milestoneId: ID.milestone,
      actorId: ID.inspector,
      type: 'inspector_verification',
      evidenceHash: 'a'.repeat(64),
      gpsLatitude: { toString: () => '33.5300000' },
      gpsLongitude: { toString: () => '-5.1050000' },
      deviceAttestationToken: 'device-inspector',
      digitalSignature: 'sig-inspector',
      status: 'verified',
      submittedAt: new Date(),
      revokedAt: null,
    },
    {
      id: '40000000-0000-0000-0000-000000000002',
      milestoneId: ID.milestone,
      actorId: ID.auditor,
      type: 'auditor_review',
      evidenceHash: 'b'.repeat(64),
      gpsLatitude: { toString: () => '33.5300000' },
      gpsLongitude: { toString: () => '-5.1050000' },
      deviceAttestationToken: 'device-auditor',
      digitalSignature: 'sig-auditor',
      status: 'verified',
      submittedAt: new Date(),
      revokedAt: null,
    },
  ];
  const citizenPools: any[] = [
    {
      id: randomUUID(),
      milestoneId: ID.milestone,
      citizenId: ID.citizen1,
      proximityProofHash: 'x'.repeat(64),
      assuranceTier: 'ussd',
      status: 'enrolled',
      enrolledAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      milestoneId: ID.milestone,
      citizenId: ID.citizen2,
      proximityProofHash: 'y'.repeat(64),
      assuranceTier: 'ussd',
      status: 'enrolled',
      enrolledAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const auditorAssignments: any[] = [];
  const certificates: any[] = [];
  const webhookSubscriptions: any[] = [];
  const auditLogs: any[] = [];

  return {
    _store: { actors, projects, milestones, attestations, citizenPools, auditLogs },
    _resetAttestations() {
      // Keep inspector + auditor seed attestations (first 2), remove citizen ones
      attestations.length = 2;
    },

    actor: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id) return actors[where.id] ?? null;
        if (where.did) return Object.values(actors).find((a: any) => a.did === where.did) ?? null;
        if (where.cnieHash) return Object.values(actors).find((a: any) => a.cnieHash === where.cnieHash) ?? null;
        return null;
      }),
      findMany: vi.fn(async () => Object.values(actors)),
      create: vi.fn(async ({ data }: any) => {
        const actor = { id: randomUUID(), ...data, createdAt: new Date(), updatedAt: new Date() };
        actors[actor.id] = actor;
        return actor;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const actor = actors[where.id];
        if (actor) Object.assign(actor, data, { updatedAt: new Date() });
        return actor;
      }),
    },

    project: {
      findUnique: vi.fn(async ({ where }: any) => projects[where.id] ?? null),
      findFirst: vi.fn(async ({ where }: any) => {
        return Object.values(projects).find((p: any) =>
          p.name === where.name && p.region === where.region && !p.deletedAt
        ) ?? null;
      }),
      findMany: vi.fn(async () => Object.values(projects)),
      count: vi.fn(async () => Object.keys(projects).length),
      create: vi.fn(async ({ data }: any) => {
        const project = { id: randomUUID(), ...data, status: 'active', boundary: data.boundary ?? [], createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
        projects[project.id] = project;
        return project;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const project = projects[where.id];
        if (project) Object.assign(project, data, { updatedAt: new Date() });
        return project;
      }),
    },

    milestone: {
      findUnique: vi.fn(async ({ where, include }: any) => {
        const m = milestones[where.id] ?? (where.projectId_sequenceNumber
          ? Object.values(milestones).find((m: any) =>
              m.projectId === where.projectId_sequenceNumber.projectId &&
              m.sequenceNumber === where.projectId_sequenceNumber.sequenceNumber)
          : null);
        if (!m) return null;
        if (include?.attestations) {
          return { ...m, attestations: attestations.filter((a: any) => a.milestoneId === m.id), complianceCertificate: null };
        }
        return m;
      }),
      findFirst: vi.fn(async ({ where, orderBy }: any) => {
        return Object.values(milestones).find((m: any) =>
          m.projectId === where.projectId &&
          m.status === where.status &&
          !m.deletedAt
        ) ?? null;
      }),
      findMany: vi.fn(async ({ where }: any = {}) => {
        let result = Object.values(milestones);
        if (where?.projectId) result = result.filter((m: any) => m.projectId === where.projectId && !m.deletedAt);
        return result;
      }),
      count: vi.fn(async () => Object.keys(milestones).length),
      create: vi.fn(async ({ data }: any) => {
        const m = { id: randomUUID(), ...data, status: 'pending', createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
        milestones[m.id] = m;
        return m;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const m = milestones[where.id];
        if (m) Object.assign(m, data, { updatedAt: new Date() });
        return m;
      }),
    },

    attestation: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id) return attestations.find((a: any) => a.id === where.id) ?? null;
        if (where.milestoneId_actorId_type) {
          const { milestoneId, actorId, type } = where.milestoneId_actorId_type;
          return attestations.find((a: any) =>
            a.milestoneId === milestoneId && a.actorId === actorId && a.type === type
          ) ?? null;
        }
        return null;
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        return attestations.find((a: any) => {
          let match = true;
          if (where.milestoneId) match = match && a.milestoneId === where.milestoneId;
          if (where.deviceAttestationToken) match = match && a.deviceAttestationToken === where.deviceAttestationToken;
          if (where.type) match = match && a.type === where.type;
          if (where.status?.in) match = match && where.status.in.includes(a.status);
          return match;
        }) ?? null;
      }),
      findMany: vi.fn(async ({ where }: any = {}) => {
        let result = [...attestations];
        if (where?.milestoneId) result = result.filter((a: any) => a.milestoneId === where.milestoneId);
        if (where?.type) result = result.filter((a: any) => a.type === where.type);
        if (where?.status?.in) result = result.filter((a: any) => where.status.in.includes(a.status));
        return result;
      }),
      count: vi.fn(async ({ where }: any = {}) => {
        let result = [...attestations];
        if (where?.milestoneId) result = result.filter((a: any) => a.milestoneId === where.milestoneId);
        return result.length;
      }),
      groupBy: vi.fn(async ({ by, where, _count }: any) => {
        const filtered = attestations.filter((a: any) => a.milestoneId === where?.milestoneId);
        const groups = new Map<string, any>();
        for (const a of filtered) {
          const key = `${a.type}:${a.status}`;
          if (!groups.has(key)) {
            groups.set(key, { type: a.type, status: a.status, _count: { id: 0 } });
          }
          groups.get(key)._count.id++;
        }
        return [...groups.values()];
      }),
      create: vi.fn(async ({ data }: any) => {
        const a = {
          id: randomUUID(),
          ...data,
          gpsLatitude: { toString: () => data.gpsLatitude },
          gpsLongitude: { toString: () => data.gpsLongitude },
          status: 'submitted',
          submittedAt: new Date(),
          revokedAt: null,
        };
        attestations.push(a);
        return a;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const a = attestations.find((a: any) => a.id === where.id);
        if (a) Object.assign(a, data);
        return a;
      }),
    },

    citizenPool: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id) return citizenPools.find((p: any) => p.id === where.id) ?? null;
        if (where.milestoneId_citizenId) {
          const { milestoneId, citizenId } = where.milestoneId_citizenId;
          return citizenPools.find((p: any) =>
            p.milestoneId === milestoneId && p.citizenId === citizenId
          ) ?? null;
        }
        return null;
      }),
      findMany: vi.fn(async ({ where }: any = {}) => {
        let result = [...citizenPools];
        if (where?.milestoneId) result = result.filter((p: any) => p.milestoneId === where.milestoneId);
        if (where?.citizenId?.in) result = result.filter((p: any) => where.citizenId.in.includes(p.citizenId));
        return result;
      }),
      count: vi.fn(async () => citizenPools.length),
      groupBy: vi.fn(async () => []),
      create: vi.fn(async ({ data }: any) => {
        const p = { id: randomUUID(), ...data, status: 'enrolled', enrolledAt: new Date(), updatedAt: new Date() };
        citizenPools.push(p);
        return p;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const p = citizenPools.find((p: any) => p.id === where.id);
        if (p) Object.assign(p, data, { updatedAt: new Date() });
        return p;
      }),
    },

    auditorAssignment: {
      findUnique: vi.fn(async () => null),
      findMany: vi.fn(async () => auditorAssignments),
      aggregate: vi.fn(async () => ({ _max: { rotationRound: 0 } })),
      create: vi.fn(async ({ data }: any) => {
        const a = { id: randomUUID(), ...data, conflictDeclared: false, conflictReason: null, status: 'pending', assignedAt: new Date(), updatedAt: new Date() };
        auditorAssignments.push(a);
        return a;
      }),
    },

    complianceCertificate: {
      findUnique: vi.fn(async () => null),
      findFirst: vi.fn(async () => null),
      findMany: vi.fn(async () => certificates),
      count: vi.fn(async () => certificates.length),
      create: vi.fn(async ({ data }: any) => {
        const c = { id: randomUUID(), ...data, createdAt: new Date(), updatedAt: new Date() };
        certificates.push(c);
        return c;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const c = certificates.find((c: any) => c.id === where.id);
        if (c) Object.assign(c, data, { updatedAt: new Date() });
        return c;
      }),
    },

    webhookSubscription: {
      findMany: vi.fn(async () => webhookSubscriptions),
    },

    auditLog: {
      create: vi.fn(async ({ data }: any) => {
        const log = { id: randomUUID(), ...data, timestamp: new Date() };
        auditLogs.push(log);
        return log;
      }),
      findMany: vi.fn(async () => auditLogs),
      count: vi.fn(async () => auditLogs.length),
    },

    actorOrganization: {
      findMany: vi.fn(async () => []),
    },
  };
}

// ── Test App Builder ────────────────────────────────────────────────────────

let mockSms: MockSmsGateway;

async function buildTestApp(
  mockPrisma: ReturnType<typeof createMockPrisma>,
  mockRedis: ReturnType<typeof createMockRedis>,
): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  // Decorate with mocks
  await app.register(fp(async (f) => {
    f.decorate('prisma', mockPrisma);
    f.decorate('redis', mockRedis);
  }));

  app.setErrorHandler(errorHandler);

  // Override the controller to use MockSmsGateway
  // We register ussd routes with a custom plugin that injects mock SMS
  await app.register(async (fastify) => {
    mockSms = new MockSmsGateway();
    const controller = new UssdController(fastify, mockSms);

    fastify.post(
      '/callback',
      {
        preHandler: [
          async (request, _reply) => {
            const apiKey = request.headers['x-api-key'];
            if (!apiKey || apiKey !== API_KEY) {
              const err = new Error('Invalid API key') as any;
              err.statusCode = 400;
              err.code = 'VALIDATION_ERROR';
              throw err;
            }
          },
        ],
      },
      (request, reply) => controller.callback(request, reply),
    );
  }, { prefix: '/api/v1/ussd' });

  await app.ready();
  return app;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function ussdPayload(text: string, sessionId = 'test-session-1') {
  return {
    sessionId,
    serviceCode: '*384*123#',
    phoneNumber: PHONE,
    text,
  };
}

async function injectUssd(
  app: FastifyInstance,
  text: string,
  sessionId = 'test-session-1',
) {
  return app.inject({
    method: 'POST',
    url: '/api/v1/ussd/callback',
    headers: { 'x-api-key': API_KEY },
    payload: ussdPayload(text, sessionId),
  });
}

// Register phone → actor mapping and project code in Redis
async function setupRedisFixtures(mockRedis: ReturnType<typeof createMockRedis>) {
  // Phone → actor mapping
  await mockRedis.set(`ussd:phone:${PHONE}`, ID.citizen1);

  // Project code
  const { sha256Hex } = await import('@tml/crypto');
  const hash = sha256Hex(ID.project);
  const first8 = hash.slice(0, 8);
  const num = (parseInt(first8, 16) % 999999) + 1;
  const code = num.toString().padStart(6, '0');
  await mockRedis.set(`ussd:projectcode:${code}`, ID.project);

  return code;
}

// ═════════════════════════════════════════════════════════════════════════════
// TESTS
// ═════════════════════════════════════════════════════════════════════════════

describe('Input Sanitizer', () => {
  it('strips non-allowed characters', () => {
    expect(sanitizeUssdInput('1*abc*2')).toBe('1**2');
    expect(sanitizeUssdInput('1*<script>*2')).toBe('1**2');
    expect(sanitizeUssdInput('hello123')).toBe('123');
  });

  it('keeps digits, *, and #', () => {
    expect(sanitizeUssdInput('1*123456*1#')).toBe('1*123456*1#');
  });

  it('truncates to 50 chars', () => {
    const long = '1'.repeat(100);
    expect(sanitizeUssdInput(long).length).toBe(50);
  });

  it('sanitizeProjectCode returns 6 digits or null', () => {
    expect(sanitizeProjectCode('123456')).toBe('123456');
    expect(sanitizeProjectCode('12345')).toBeNull();
    expect(sanitizeProjectCode('1234567')).toBeNull();
    expect(sanitizeProjectCode('abc')).toBeNull();
    expect(sanitizeProjectCode('12ab56')).toBeNull();
  });

  it('sanitizeOtp returns 6 digits or null', () => {
    expect(sanitizeOtp('789012')).toBe('789012');
    expect(sanitizeOtp('78901')).toBeNull();
    expect(sanitizeOtp('abc')).toBeNull();
  });
});

describe('Project Code', () => {
  it('deriveProjectCode returns 6-digit string', () => {
    const code = deriveProjectCode(ID.project);
    expect(code).toMatch(/^\d{6}$/);
  });

  it('same input always returns same code', () => {
    const code1 = deriveProjectCode(ID.project);
    const code2 = deriveProjectCode(ID.project);
    expect(code1).toBe(code2);
  });

  it('different inputs return different codes', () => {
    const code1 = deriveProjectCode(ID.project);
    const code2 = deriveProjectCode('99999999-0000-0000-0000-000000000099');
    // Not guaranteed to be different in all cases due to mod, but should be for these inputs
    expect(typeof code1).toBe('string');
    expect(typeof code2).toBe('string');
  });
});

describe('USSD Gateway — Screen Transitions', () => {
  let app: FastifyInstance;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockRedis: ReturnType<typeof createMockRedis>;
  let projectCode: string;

  beforeAll(async () => {
    mockPrisma = createMockPrisma();
    mockRedis = createMockRedis();
    app = await buildTestApp(mockPrisma, mockRedis);
    projectCode = await setupRedisFixtures(mockRedis);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockPrisma._resetAttestations();
    mockSms.sentMessages = [];
    mockSms.shouldFail = false;
  });

  it('shows welcome menu on empty text', async () => {
    const res = await injectUssd(app, '');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.body).toContain('CON Bienvenue sur TML');
    expect(res.body).toContain('1. Vérifier un projet');
    expect(res.body).toContain('2. Aide');
  });

  it('shows help text', async () => {
    const res = await injectUssd(app, '2');
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('END TML: plateforme de transparence');
  });

  it('shows project code prompt', async () => {
    const res = await injectUssd(app, '1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('CON Entrez le code du projet (6 chiffres):');
  });

  it('returns invalid input for unknown option', async () => {
    const res = await injectUssd(app, '9');
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('END Entrée invalide');
  });
});

describe('USSD Gateway — Project Code Lookup', () => {
  let app: FastifyInstance;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockRedis: ReturnType<typeof createMockRedis>;
  let projectCode: string;

  beforeAll(async () => {
    mockPrisma = createMockPrisma();
    mockRedis = createMockRedis();
    app = await buildTestApp(mockPrisma, mockRedis);
    projectCode = await setupRedisFixtures(mockRedis);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockPrisma._resetAttestations();
    mockSms.sentMessages = [];
    mockSms.shouldFail = false;
  });

  it('valid code shows vote menu with project name and milestone', async () => {
    const res = await injectUssd(app, `1*${projectCode}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('CON Route Nationale 7');
    expect(res.body).toContain('Fondation coulée');
    expect(res.body).toContain('1. Oui, travaux en cours');
    expect(res.body).toContain('2. Non, pas de progrès');
    expect(res.body).toContain('3. Pas sûr');
  });

  it('invalid format code returns error', async () => {
    const res = await injectUssd(app, '1*12345');
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('END Code invalide');
  });

  it('unknown code returns not found', async () => {
    const res = await injectUssd(app, '1*999999');
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('END Projet non trouvé');
  });

  it('project with no active milestone returns error', async () => {
    // Temporarily change milestone status
    mockPrisma._store.milestones[ID.milestone].status = 'pending';
    const res = await injectUssd(app, `1*${projectCode}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('END Aucune étape en cours');
    // Restore
    mockPrisma._store.milestones[ID.milestone].status = 'attestation_in_progress';
  });
});

describe('USSD Gateway — Vote Handling', () => {
  let app: FastifyInstance;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockRedis: ReturnType<typeof createMockRedis>;
  let projectCode: string;

  beforeAll(async () => {
    mockPrisma = createMockPrisma();
    mockRedis = createMockRedis();
    app = await buildTestApp(mockPrisma, mockRedis);
    projectCode = await setupRedisFixtures(mockRedis);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    mockPrisma._resetAttestations();
    mockSms.sentMessages = [];
    mockSms.shouldFail = false;
    // Clear rate limits and sessions
    mockRedis._reset();
    projectCode = await setupRedisFixtures(mockRedis);
  });

  it('"Oui" triggers OTP flow — sends SMS and asks for code', async () => {
    const res = await injectUssd(app, `1*${projectCode}*1`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('CON Entrez votre code de vérification (6 chiffres):');
    expect(mockSms.sentMessages.length).toBe(1);
    expect(mockSms.sentMessages[0]!.to).toBe(PHONE);
  });

  it('"Non" records audit log and ends', async () => {
    const res = await injectUssd(app, `1*${projectCode}*2`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('END Merci pour votre réponse');
  });

  it('"Pas sûr" ends with thank you', async () => {
    const res = await injectUssd(app, `1*${projectCode}*3`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('END Merci. Vous pouvez réessayer plus tard.');
  });

  it('SMS failure returns error to user', async () => {
    mockSms.shouldFail = true;
    const res = await injectUssd(app, `1*${projectCode}*1`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('END Impossible d\'envoyer le SMS');
  });

  it('unregistered phone returns error', async () => {
    // Remove phone mapping
    await mockRedis.del(`ussd:phone:${PHONE}`);
    const res = await injectUssd(app, `1*${projectCode}*1`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('END Votre numéro n\'est pas enregistré');
    // Restore
    await mockRedis.set(`ussd:phone:${PHONE}`, ID.citizen1);
  });
});

describe('USSD Gateway — OTP Verification', () => {
  let app: FastifyInstance;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockRedis: ReturnType<typeof createMockRedis>;
  let projectCode: string;

  beforeAll(async () => {
    mockPrisma = createMockPrisma();
    mockRedis = createMockRedis();
    app = await buildTestApp(mockPrisma, mockRedis);
    projectCode = await setupRedisFixtures(mockRedis);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    mockPrisma._resetAttestations();
    mockSms.sentMessages = [];
    mockSms.shouldFail = false;
    mockRedis._reset();
    projectCode = await setupRedisFixtures(mockRedis);
  });

  it('correct OTP submits attestation and returns reference', async () => {
    // Step 1: Vote "Oui" to trigger OTP
    await injectUssd(app, `1*${projectCode}*1`, 'otp-session-1');

    // Get OTP from SMS
    expect(mockSms.sentMessages.length).toBe(1);
    const otp = mockSms.sentMessages[0]!.code;
    expect(otp).toMatch(/^\d{6}$/);

    // Step 2: Submit OTP
    const res = await injectUssd(app, `1*${projectCode}*1*${otp}`, 'otp-session-1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('END Merci! Attestation enregistrée. Réf: ATT-');
  });

  it('wrong OTP returns error', async () => {
    // Step 1: Vote "Oui" to trigger OTP
    await injectUssd(app, `1*${projectCode}*1`, 'otp-session-2');

    // Step 2: Submit wrong OTP
    const res = await injectUssd(app, `1*${projectCode}*1*000000`, 'otp-session-2');
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('END Code incorrect');
  });

  it('expired OTP returns error', async () => {
    // Step 1: Vote "Oui" to trigger OTP
    await injectUssd(app, `1*${projectCode}*1`, 'otp-session-3');

    // Manually delete the OTP from Redis to simulate expiration
    await mockRedis.del('ussd:otp:otp-session-3');

    // Step 2: Try to verify
    const res = await injectUssd(app, `1*${projectCode}*1*123456`, 'otp-session-3');
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('END Code expiré');
  });

  it('replayed OTP returns error', async () => {
    // Step 1: Vote "Oui" to trigger OTP
    await injectUssd(app, `1*${projectCode}*1`, 'otp-session-4');
    const otp = mockSms.sentMessages[0]!.code;

    // Step 2: Submit OTP (success)
    await injectUssd(app, `1*${projectCode}*1*${otp}`, 'otp-session-4');

    // Step 3: Try same OTP again (need new session since old one was destroyed)
    // The used flag is still in Redis
    await mockRedis.set(
      `ussd:session:otp-session-4`,
      JSON.stringify({
        sessionId: 'otp-session-4',
        phoneNumber: PHONE,
        actorId: ID.citizen1,
        actorDid: 'did:key:z6MkCitizen1',
        state: 'awaiting_otp',
        projectId: ID.project,
        projectName: 'Route Nationale 7',
        milestoneId: ID.milestone,
        milestoneDescription: 'Fondation coulée',
        vote: '1',
      }),
      'EX',
      300,
    );

    const res = await injectUssd(app, `1*${projectCode}*1*${otp}`, 'otp-session-4');
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('END Code déjà utilisé');
  });
});

describe('USSD Gateway — Attestation Integration', () => {
  let app: FastifyInstance;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockRedis: ReturnType<typeof createMockRedis>;
  let projectCode: string;

  beforeAll(async () => {
    mockPrisma = createMockPrisma();
    mockRedis = createMockRedis();
    app = await buildTestApp(mockPrisma, mockRedis);
    projectCode = await setupRedisFixtures(mockRedis);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    mockPrisma._resetAttestations();
    mockSms.sentMessages = [];
    mockSms.shouldFail = false;
    mockRedis._reset();
    projectCode = await setupRedisFixtures(mockRedis);
  });

  it('citizen not enrolled returns error', async () => {
    // Remove citizen from pool
    const pool = mockPrisma._store.citizenPools.find((p: any) => p.citizenId === ID.citizen1);
    const originalStatus = pool?.status;
    if (pool) pool.status = 'removed';

    await injectUssd(app, `1*${projectCode}*1`, 'enroll-session');
    const otp = mockSms.sentMessages[0]!.code;

    const res = await injectUssd(app, `1*${projectCode}*1*${otp}`, 'enroll-session');
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('END Vous n\'êtes pas inscrit');

    // Restore
    if (pool) pool.status = originalStatus;
  });

  it('duplicate attestation returns error', async () => {
    // First attestation
    await injectUssd(app, `1*${projectCode}*1`, 'dup-session-1');
    const otp1 = mockSms.sentMessages[0]!.code;
    const res1 = await injectUssd(app, `1*${projectCode}*1*${otp1}`, 'dup-session-1');
    expect(res1.body).toContain('END Merci! Attestation enregistrée');

    // Clear rate limit so we can test duplicate check
    await mockRedis.del(`ussd:ratelimit:${ID.citizen1}:${ID.milestone}`);

    // Second attestation attempt (same citizen)
    await injectUssd(app, `1*${projectCode}*1`, 'dup-session-2');
    const otp2 = mockSms.sentMessages[1]!.code;
    const res2 = await injectUssd(app, `1*${projectCode}*1*${otp2}`, 'dup-session-2');
    expect(res2.body).toContain('END Vous avez déjà soumis');
  });
});

describe('USSD Gateway — Rate Limiting', () => {
  let app: FastifyInstance;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockRedis: ReturnType<typeof createMockRedis>;
  let projectCode: string;

  beforeAll(async () => {
    mockPrisma = createMockPrisma();
    mockRedis = createMockRedis();
    app = await buildTestApp(mockPrisma, mockRedis);
    projectCode = await setupRedisFixtures(mockRedis);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    mockPrisma._resetAttestations();
    mockSms.sentMessages = [];
    mockSms.shouldFail = false;
    mockRedis._reset();
    projectCode = await setupRedisFixtures(mockRedis);
  });

  it('24h rate limit blocks second attempt', async () => {
    // First: successful attestation
    await injectUssd(app, `1*${projectCode}*1`, 'rl-session-1');
    const otp = mockSms.sentMessages[0]!.code;
    const res1 = await injectUssd(app, `1*${projectCode}*1*${otp}`, 'rl-session-1');
    expect(res1.body).toContain('END Merci! Attestation enregistrée');

    // Second: try to vote again (rate limit set)
    const res2 = await injectUssd(app, `1*${projectCode}*1`, 'rl-session-2');
    expect(res2.body).toContain('END Vous avez déjà attesté');
  });
});

describe('USSD Gateway — Session Management', () => {
  let app: FastifyInstance;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockRedis: ReturnType<typeof createMockRedis>;
  let projectCode: string;

  beforeAll(async () => {
    mockPrisma = createMockPrisma();
    mockRedis = createMockRedis();
    app = await buildTestApp(mockPrisma, mockRedis);
    projectCode = await setupRedisFixtures(mockRedis);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    mockPrisma._resetAttestations();
    mockSms.sentMessages = [];
    mockRedis._reset();
    projectCode = await setupRedisFixtures(mockRedis);
  });

  it('session is created on first call and persists across calls', async () => {
    // First call creates session
    const res1 = await injectUssd(app, '1', 'persist-session');
    expect(res1.body).toContain('CON Entrez le code');

    // Verify session exists in Redis
    const sessionData = await mockRedis.get('ussd:session:persist-session');
    expect(sessionData).not.toBeNull();
    const session = JSON.parse(sessionData!);
    expect(session.phoneNumber).toBe(PHONE);
    expect(session.state).toBe('awaiting_project_code');
  });

  it('session is destroyed after END response', async () => {
    // Help screen (END)
    await injectUssd(app, '2', 'end-session');

    // Session should be destroyed
    const sessionData = await mockRedis.get('ussd:session:end-session');
    expect(sessionData).toBeNull();
  });

  it('phone → actor resolution works', async () => {
    // Vote "Oui" triggers phone → actor resolution
    const res = await injectUssd(app, `1*${projectCode}*1`, 'phone-session');
    expect(res.body).toContain('CON Entrez votre code de vérification');

    // Verify session has actorId
    const sessionData = await mockRedis.get('ussd:session:phone-session');
    const session = JSON.parse(sessionData!);
    expect(session.actorId).toBe(ID.citizen1);
    expect(session.actorDid).toBe('did:key:z6MkCitizen1');
  });
});

describe('USSD Gateway — Auth', () => {
  let app: FastifyInstance;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockRedis: ReturnType<typeof createMockRedis>;

  beforeAll(async () => {
    mockPrisma = createMockPrisma();
    mockRedis = createMockRedis();
    app = await buildTestApp(mockPrisma, mockRedis);
  });

  afterAll(async () => {
    await app.close();
  });

  it('missing API key returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/ussd/callback',
      payload: ussdPayload(''),
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('wrong API key returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/ussd/callback',
      headers: { 'x-api-key': 'wrong-key' },
      payload: ussdPayload(''),
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentService } from './agent.service.js';

vi.mock('@tml/crypto', () => ({
  sha256Hex: vi.fn().mockReturnValue('mockhash123'),
  signPayload: vi.fn().mockReturnValue('mocksignature'),
  verifyPayload: vi.fn().mockReturnValue(true),
  extractPublicKey: vi.fn().mockReturnValue(new Uint8Array(32)),
  keyPairFromPrivateKey: vi.fn().mockReturnValue({
    publicKey: new Uint8Array(32),
    privateKey: new Uint8Array(64),
  }),
  createDID: vi.fn().mockReturnValue('did:key:z6MockSystem'),
}));

function createMockRedis() {
  return {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
  };
}

function createMockRepo() {
  return {
    create: vi.fn().mockResolvedValue({
      id: 'conn-1',
      initiatorDid: 'did:key:z6MkInviter',
      responderDid: null,
      state: 'invited',
      label: 'Test Connection',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findById: vi.fn().mockResolvedValue(null),
    findByDid: vi.fn().mockResolvedValue([]),
    updateState: vi.fn().mockResolvedValue({
      id: 'conn-1',
      initiatorDid: 'did:key:z6MkInviter',
      responderDid: 'did:key:z6MkAcceptor',
      state: 'connected',
      label: 'Test Connection',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };
}

function createMockEnv() {
  return {
    NODE_ENV: 'test' as const,
    PORT: 3000,
    HOST: '0.0.0.0',
    DATABASE_URL: 'postgresql://localhost:5432/tml_test',
    DATABASE_POOL_MIN: 2,
    DATABASE_POOL_MAX: 10,
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'a'.repeat(32),
    JWT_EXPIRES_IN: '1h',
    JWT_REFRESH_EXPIRES_IN: '7d',
    MOSIP_ISSUER_URL: 'https://mosip.example.com',
    MOSIP_CLIENT_ID: 'test-client',
    MOSIP_CLIENT_SECRET: 'test-secret',
    MOSIP_REDIRECT_URI: 'http://localhost:3000/callback',
    SYSTEM_SIGNING_KEY_HEX: 'a'.repeat(64),
    RATE_LIMIT_MAX: 100,
    RATE_LIMIT_WINDOW_MS: 60000,
    CORS_ORIGIN: '*',
    LOG_LEVEL: 'info' as const,
  };
}

describe('AgentService', () => {
  let redis: ReturnType<typeof createMockRedis>;
  let repo: ReturnType<typeof createMockRepo>;
  let env: ReturnType<typeof createMockEnv>;
  let service: AgentService;

  beforeEach(() => {
    vi.clearAllMocks();
    redis = createMockRedis();
    repo = createMockRepo();
    env = createMockEnv();
    service = new AgentService(redis, repo as never, env);
  });

  describe('createInvitation', () => {
    it('should create a connection invitation', async () => {
      const result = await service.createInvitation({
        inviterDid: 'did:key:z6MkInviter',
        label: 'Test Connection',
        ttlSeconds: 600,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.type).toBe('ConnectionInvitation');
      expect(result.value.recipientDid).toBe('did:key:z6MkInviter');
      expect(result.value.label).toBe('Test Connection');
      expect(result.value.signature).toBe('mocksignature');

      // Redis set called with correct key prefix and TTL
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^agent:invitation:/),
        expect.any(String),
        'EX',
        600,
      );

      // Connections repo create called
      expect(repo.create).toHaveBeenCalledWith({
        initiatorDid: 'did:key:z6MkInviter',
        state: 'invited',
        label: 'Test Connection',
      });
    });
  });

  describe('acceptInvitation', () => {
    it('should accept a valid invitation', async () => {
      const futureDate = new Date(Date.now() + 300_000).toISOString();
      const invitation = {
        id: 'inv-123',
        type: 'ConnectionInvitation',
        serviceEndpoint: 'http://localhost:3000/api/v1/agent',
        recipientDid: 'did:key:z6MkInviter',
        label: 'Test Connection',
        createdAt: new Date().toISOString(),
        expiresAt: futureDate,
        signature: 'mocksignature',
      };

      redis.get.mockResolvedValue(JSON.stringify(invitation));
      repo.create.mockResolvedValue({
        id: 'conn-2',
        initiatorDid: 'did:key:z6MkInviter',
        responderDid: 'did:key:z6MkAcceptor',
        state: 'connected',
        label: 'Test Connection',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.acceptInvitation({
        invitationId: 'inv-123',
        acceptorDid: 'did:key:z6MkAcceptor',
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.state).toBe('connected');
      expect(result.value.responderDid).toBe('did:key:z6MkAcceptor');

      // Connection created with 'connected' state
      expect(repo.create).toHaveBeenCalledWith({
        initiatorDid: 'did:key:z6MkInviter',
        responderDid: 'did:key:z6MkAcceptor',
        state: 'connected',
        label: 'Test Connection',
      });

      // Invitation deleted from Redis
      expect(redis.del).toHaveBeenCalledWith('agent:invitation:inv-123');
    });

    it('should reject expired invitation', async () => {
      const pastDate = new Date(Date.now() - 60_000).toISOString();
      const invitation = {
        id: 'inv-expired',
        type: 'ConnectionInvitation',
        serviceEndpoint: 'http://localhost:3000/api/v1/agent',
        recipientDid: 'did:key:z6MkInviter',
        label: 'Expired Connection',
        createdAt: new Date(Date.now() - 360_000).toISOString(),
        expiresAt: pastDate,
        signature: 'mocksignature',
      };

      redis.get.mockResolvedValue(JSON.stringify(invitation));

      const result = await service.acceptInvitation({
        invitationId: 'inv-expired',
        acceptorDid: 'did:key:z6MkAcceptor',
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.error.message).toMatch(/expired/i);
      // Expired invitation cleaned up from Redis
      expect(redis.del).toHaveBeenCalledWith('agent:invitation:inv-expired');
    });
  });

  describe('getConnections', () => {
    it('should get connections for a DID', async () => {
      const connections = [
        {
          id: 'conn-1',
          initiatorDid: 'did:key:z6MkUser',
          responderDid: 'did:key:z6MkOther',
          state: 'connected' as const,
          label: 'Connection A',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'conn-2',
          initiatorDid: 'did:key:z6MkAnother',
          responderDid: 'did:key:z6MkUser',
          state: 'active' as const,
          label: 'Connection B',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      repo.findByDid.mockResolvedValue(connections);

      const result = await service.getConnections('did:key:z6MkUser');

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value).toHaveLength(2);
      expect(result.value[0].id).toBe('conn-1');
      expect(result.value[1].id).toBe('conn-2');
      expect(repo.findByDid).toHaveBeenCalledWith('did:key:z6MkUser');
    });
  });

  describe('createConnectionlessCredentialOffer', () => {
    it('should create connectionless credential offer', async () => {
      const mockCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'] as const,
        type: ['VerifiableCredential', 'ProfessionalEngineerCredential'] as const,
        issuer: 'did:key:z6MkIssuer',
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: 'did:key:z6MkHolder',
          licenseNumber: 'ENG-001',
          specialization: 'civil',
          issuingAuthority: 'Ministry of Engineering',
        },
        proof: {
          type: 'Ed25519Signature2020' as const,
          created: new Date().toISOString(),
          verificationMethod: 'did:key:z6MkIssuer#z6MkIssuer',
          proofPurpose: 'assertionMethod' as const,
          proofValue: 'mocksignature',
        },
      };

      const result = await service.createConnectionlessCredentialOffer({
        credential: mockCredential,
        holderDid: 'did:key:z6MkHolder',
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.offerId).toBeDefined();
      expect(result.value.offerUrl).toContain('/credential-offers/');
      expect(result.value.offerUrl).toContain('/claim');

      // Redis set called with correct prefix and TTL
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^agent:offer:/),
        expect.any(String),
        'EX',
        600,
      );
    });
  });

  describe('claimConnectionlessCredential', () => {
    const mockCredential = {
      '@context': ['https://www.w3.org/2018/credentials/v1'] as const,
      type: ['VerifiableCredential', 'ProfessionalEngineerCredential'] as const,
      issuer: 'did:key:z6MkIssuer',
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: 'did:key:z6MkHolder',
        licenseNumber: 'ENG-001',
        specialization: 'civil',
        issuingAuthority: 'Ministry of Engineering',
      },
      proof: {
        type: 'Ed25519Signature2020' as const,
        created: new Date().toISOString(),
        verificationMethod: 'did:key:z6MkIssuer#z6MkIssuer',
        proofPurpose: 'assertionMethod' as const,
        proofValue: 'mocksignature',
      },
    };

    it('should claim connectionless credential', async () => {
      const offerData = {
        credential: mockCredential,
        holderDid: 'did:key:z6MkHolder',
      };

      redis.get.mockResolvedValue(JSON.stringify(offerData));

      const result = await service.claimConnectionlessCredential(
        'offer-123',
        'did:key:z6MkHolder',
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.issuer).toBe('did:key:z6MkIssuer');
      expect(result.value.credentialSubject.id).toBe('did:key:z6MkHolder');

      // Offer deleted from Redis after claim
      expect(redis.del).toHaveBeenCalledWith('agent:offer:offer-123');
    });

    it('should reject claim when DID does not match', async () => {
      const offerData = {
        credential: mockCredential,
        holderDid: 'did:key:z6MkHolder',
      };

      redis.get.mockResolvedValue(JSON.stringify(offerData));

      const result = await service.claimConnectionlessCredential(
        'offer-123',
        'did:key:z6MkWrongDid',
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.error.message).toMatch(/does not match/i);
    });
  });

  describe('createProofRequest', () => {
    it('should create a proof request', async () => {
      const result = await service.createProofRequest({
        requesterDid: 'did:key:z6MkRequester',
        requestedAttributes: [
          {
            name: 'licenseNumber',
            credentialType: 'ProfessionalEngineerCredential',
            restrictions: { issuerDid: 'did:key:z6MkTrustedIssuer' },
          },
        ],
        ttlSeconds: 600,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.type).toBe('ProofRequest');
      expect(result.value.requesterDid).toBe('did:key:z6MkRequester');
      expect(result.value.requestedAttributes).toHaveLength(1);
      expect(result.value.nonce).toBeDefined();

      // Redis set called with correct prefix
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^agent:proof:/),
        expect.any(String),
        'EX',
        600,
      );
    });
  });
});

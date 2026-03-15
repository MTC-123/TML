import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';
import { generateKeyPair } from '@tml/crypto';
import type { Actor, ActorRole } from '@tml/types';
import type { ActorsRepository } from '../repositories/actors.repository.js';
import type { OidcDiscoveryService } from './oidc-discovery.service.js';
import type { Env } from '../config/env.js';

// --- Helpers ---

function buildFakeIdToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = Buffer.from('fake-signature').toString('base64url');
  return `${header}.${body}.${signature}`;
}

function createMockActor(overrides?: Partial<Actor>): Actor {
  return {
    id: 'actor-1',
    did: 'did:key:z6MkTest',
    cnieHash: 'abc123',
    roles: ['citizen' as ActorRole],
    assuranceLevel: null,
    lastAuthAcr: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

function createMockRedis() {
  return {
    get: vi.fn<(key: string) => Promise<string | null>>().mockResolvedValue(null),
    set: vi.fn<(key: string, value: string, option?: string, ttl?: number) => Promise<unknown>>().mockResolvedValue('OK'),
    del: vi.fn<(key: string) => Promise<number>>().mockResolvedValue(1),
  };
}

function createMockJwt() {
  return {
    sign: vi.fn<(payload: Record<string, unknown>, options?: { expiresIn?: string }) => string>().mockReturnValue('jwt-access-token'),
  };
}

function createMockActorsRepo(): {
  [K in keyof ActorsRepository]: ActorsRepository[K] extends (...args: infer A) => infer R
    ? ReturnType<typeof vi.fn<(...args: A) => R>>
    : never;
} {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByDid: vi.fn().mockResolvedValue(null),
    findByCnieHash: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(createMockActor()),
    update: vi.fn().mockResolvedValue(createMockActor()),
    updateAssurance: vi.fn().mockResolvedValue(createMockActor({ assuranceLevel: 'high', lastAuthAcr: 'mosip:idp:acr:biometrics' })),
    findByRole: vi.fn().mockResolvedValue([]),
    findOrganizationIdsForActors: vi.fn().mockResolvedValue([]),
    findActorIdsByOrganizationIds: vi.fn().mockResolvedValue([]),
  };
}

function createMockOidcDiscovery(): {
  [K in keyof OidcDiscoveryService]: ReturnType<typeof vi.fn>;
} {
  return {
    getDocument: vi.fn().mockResolvedValue({
      ok: true,
      value: {
        issuer: 'https://esignet.mosip.io',
        authorization_endpoint: 'https://esignet.mosip.io/authorize',
        token_endpoint: 'https://esignet.mosip.io/oauth/token',
        jwks_uri: 'https://esignet.mosip.io/.well-known/jwks.json',
      },
    }),
    getTokenEndpoint: vi.fn().mockResolvedValue({ ok: true, value: 'https://esignet.mosip.io/oauth/token' }),
    getAuthorizationEndpoint: vi.fn().mockResolvedValue({ ok: true, value: 'https://esignet.mosip.io/authorize' }),
    invalidateCache: vi.fn().mockResolvedValue(undefined),
  };
}

// Generate a valid Ed25519 private key hex for tests
const testKeyPair = generateKeyPair();
const testPrivateKeyHex = Buffer.from(testKeyPair.privateKey).toString('hex');

function createBaseEnv(overrides?: Partial<Env>): Env {
  return {
    NODE_ENV: 'test',
    PORT: 3000,
    HOST: '0.0.0.0',
    DATABASE_URL: 'postgresql://localhost:5432/tml_test',
    DATABASE_POOL_MIN: 2,
    DATABASE_POOL_MAX: 10,
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'a-very-long-secret-that-is-at-least-32-chars',
    JWT_EXPIRES_IN: '1h',
    JWT_REFRESH_EXPIRES_IN: '7d',
    MOSIP_ISSUER_URL: 'https://esignet.mosip.io',
    MOSIP_CLIENT_ID: 'tml-client',
    MOSIP_CLIENT_SECRET: 'test-secret',
    MOSIP_CLIENT_PRIVATE_KEY_HEX: undefined,
    MOSIP_REDIRECT_URI: 'http://localhost:3000/api/v1/auth/callback',
    SYSTEM_SIGNING_KEY_HEX: testPrivateKeyHex,
    RATE_LIMIT_MAX: 100,
    RATE_LIMIT_WINDOW_MS: 60_000,
    AFRICASTALKING_API_KEY: undefined,
    AFRICASTALKING_USERNAME: undefined,
    CORS_ORIGIN: '*',
    LOG_LEVEL: 'info',
    ...overrides,
  } as unknown as Env;
}

// --- Tests ---

describe('AuthService', () => {
  let redis: ReturnType<typeof createMockRedis>;
  let jwt: ReturnType<typeof createMockJwt>;
  let actorsRepo: ReturnType<typeof createMockActorsRepo>;
  let oidcDiscovery: ReturnType<typeof createMockOidcDiscovery>;

  beforeEach(() => {
    vi.restoreAllMocks();
    redis = createMockRedis();
    jwt = createMockJwt();
    actorsRepo = createMockActorsRepo();
    oidcDiscovery = createMockOidcDiscovery();
  });

  describe('handleCallback()', () => {
    it('uses private_key_jwt when MOSIP_CLIENT_PRIVATE_KEY_HEX is set', async () => {
      const env = createBaseEnv({
        MOSIP_CLIENT_PRIVATE_KEY_HEX: testPrivateKeyHex,
        MOSIP_CLIENT_SECRET: undefined,
      });

      const service = new AuthService(
        actorsRepo as unknown as ActorsRepository,
        redis,
        jwt,
        env,
        oidcDiscovery as unknown as OidcDiscoveryService,
      );

      const idToken = buildFakeIdToken({ sub: 'user-cnie-123' });
      let capturedBody = '';
      const mockFetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
        capturedBody = init.body as string;
        return {
          ok: true,
          json: () => Promise.resolve({ id_token: idToken }),
        };
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await service.handleCallback('auth-code-123');

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledOnce();

      // Verify the request body uses private_key_jwt, NOT client_secret
      const params = new URLSearchParams(capturedBody);
      expect(params.get('client_assertion_type')).toBe(
        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      );
      expect(params.has('client_assertion')).toBe(true);
      expect(params.has('client_secret')).toBe(false);

      // Verify the client_assertion is a valid 3-part JWT
      const assertion = params.get('client_assertion')!;
      expect(assertion.split('.')).toHaveLength(3);
    });

    it('falls back to client_secret when only MOSIP_CLIENT_SECRET is set', async () => {
      const env = createBaseEnv({
        MOSIP_CLIENT_SECRET: 'my-secret',
        MOSIP_CLIENT_PRIVATE_KEY_HEX: undefined,
      });

      const service = new AuthService(
        actorsRepo as unknown as ActorsRepository,
        redis,
        jwt,
        env,
        oidcDiscovery as unknown as OidcDiscoveryService,
      );

      const idToken = buildFakeIdToken({ sub: 'user-cnie-456' });
      let capturedBody = '';
      const mockFetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
        capturedBody = init.body as string;
        return {
          ok: true,
          json: () => Promise.resolve({ id_token: idToken }),
        };
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await service.handleCallback('auth-code-456');

      expect(result.ok).toBe(true);

      const params = new URLSearchParams(capturedBody);
      expect(params.get('client_secret')).toBe('my-secret');
      expect(params.has('client_assertion')).toBe(false);
      expect(params.has('client_assertion_type')).toBe(false);
    });

    it('extracts ACR from ID token and calls updateAssurance', async () => {
      const env = createBaseEnv({
        MOSIP_CLIENT_SECRET: 'test-secret',
        MOSIP_CLIENT_PRIVATE_KEY_HEX: undefined,
      });

      const existingActor = createMockActor();
      actorsRepo.findByCnieHash.mockResolvedValue(existingActor);
      actorsRepo.updateAssurance.mockResolvedValue(
        createMockActor({ assuranceLevel: 'high', lastAuthAcr: 'mosip:idp:acr:biometrics' }),
      );

      const service = new AuthService(
        actorsRepo as unknown as ActorsRepository,
        redis,
        jwt,
        env,
        oidcDiscovery as unknown as OidcDiscoveryService,
      );

      const idToken = buildFakeIdToken({
        sub: 'user-cnie-789',
        acr: 'mosip:idp:acr:biometrics',
      });
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id_token: idToken }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await service.handleCallback('auth-code-789');

      expect(result.ok).toBe(true);
      expect(actorsRepo.updateAssurance).toHaveBeenCalledWith(
        existingActor.id,
        'high', // biometrics maps to 'high'
        'mosip:idp:acr:biometrics',
      );
    });
  });

  describe('getLoginUrl()', () => {
    it('uses authorization endpoint from OIDC discovery', async () => {
      const customAuthEndpoint = 'https://custom-auth.example.com/authorize';
      oidcDiscovery.getAuthorizationEndpoint.mockResolvedValue({
        ok: true,
        value: customAuthEndpoint,
      });

      const env = createBaseEnv();
      const service = new AuthService(
        actorsRepo as unknown as ActorsRepository,
        redis,
        jwt,
        env,
        oidcDiscovery as unknown as OidcDiscoveryService,
      );

      const result = await service.getLoginUrl();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toContain(customAuthEndpoint);
        expect(result.value).toContain('response_type=code');
        expect(result.value).toContain(`client_id=${env.MOSIP_CLIENT_ID}`);
        expect(result.value).toContain(encodeURIComponent(env.MOSIP_REDIRECT_URI));
      }

      expect(oidcDiscovery.getAuthorizationEndpoint).toHaveBeenCalledOnce();
    });
  });

  describe('integration: full login flow', () => {
    it('resolves discovery, exchanges code, creates actor, and issues tokens', async () => {
      const env = createBaseEnv({
        MOSIP_CLIENT_SECRET: 'integration-secret',
        MOSIP_CLIENT_PRIVATE_KEY_HEX: undefined,
      });

      const newActor = createMockActor({ id: 'new-actor-id', did: 'did:key:z6MkNew' });
      actorsRepo.findByCnieHash.mockResolvedValue(null); // actor does not exist yet
      actorsRepo.create.mockResolvedValue(newActor);

      const service = new AuthService(
        actorsRepo as unknown as ActorsRepository,
        redis,
        jwt,
        env,
        oidcDiscovery as unknown as OidcDiscoveryService,
      );

      // Step 1: Get login URL — should use discovery endpoint
      const loginResult = await service.getLoginUrl();
      expect(loginResult.ok).toBe(true);
      if (loginResult.ok) {
        expect(loginResult.value).toContain('https://esignet.mosip.io/authorize');
      }

      // Step 2: Handle callback — mock the token exchange
      const idToken = buildFakeIdToken({ sub: 'new-citizen-cnie' });
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id_token: idToken }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const callbackResult = await service.handleCallback('exchange-code');

      expect(callbackResult.ok).toBe(true);
      if (callbackResult.ok) {
        expect(callbackResult.value.accessToken).toBe('jwt-access-token');
        expect(callbackResult.value.refreshToken).toBeDefined();
        expect(callbackResult.value.actor.id).toBe('new-actor-id');
      }

      // Verify the discovery service was used for the token endpoint
      expect(oidcDiscovery.getTokenEndpoint).toHaveBeenCalled();

      // Verify actor was created (not found by CNIE hash)
      expect(actorsRepo.findByCnieHash).toHaveBeenCalled();
      expect(actorsRepo.create).toHaveBeenCalled();

      // Verify refresh token was stored in Redis
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^refresh:/),
        newActor.id,
        'EX',
        expect.any(Number),
      );

      // Verify JWT was signed with actor data
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: newActor.did,
          did: newActor.did,
          actorId: newActor.id,
        }),
      );
    });
  });
});

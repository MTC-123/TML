import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OidcDiscoveryService } from './oidc-discovery.service.js';

const ISSUER_URL = 'https://esignet.mosip.io';

const mockDiscoveryDocument = {
  issuer: 'https://esignet.mosip.io',
  authorization_endpoint: 'https://esignet.mosip.io/authorize',
  token_endpoint: 'https://esignet.mosip.io/oauth/token',
  jwks_uri: 'https://esignet.mosip.io/.well-known/jwks.json',
};

function createMockRedis() {
  return {
    get: vi.fn<(key: string) => Promise<string | null>>().mockResolvedValue(null),
    set: vi.fn<(key: string, value: string, option?: string, ttl?: number) => Promise<unknown>>().mockResolvedValue('OK'),
    del: vi.fn<(key: string) => Promise<number>>().mockResolvedValue(1),
  };
}

describe('OidcDiscoveryService', () => {
  let redis: ReturnType<typeof createMockRedis>;
  let service: OidcDiscoveryService;

  beforeEach(() => {
    vi.restoreAllMocks();
    redis = createMockRedis();
    service = new OidcDiscoveryService(redis, ISSUER_URL);
  });

  it('fetches and caches discovery document on first call', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDiscoveryDocument),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await service.getDocument();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.issuer).toBe(ISSUER_URL);
      expect(result.value.token_endpoint).toBe('https://esignet.mosip.io/oauth/token');
      expect(result.value.authorization_endpoint).toBe('https://esignet.mosip.io/authorize');
      expect(result.value.jwks_uri).toBe('https://esignet.mosip.io/.well-known/jwks.json');
    }

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      `${ISSUER_URL}/.well-known/openid-configuration`,
    );
    expect(redis.set).toHaveBeenCalledWith(
      'oidc:discovery',
      JSON.stringify(mockDiscoveryDocument),
      'EX',
      3600,
    );
  });

  it('returns cached document without fetching when cache exists', async () => {
    redis.get.mockResolvedValue(JSON.stringify(mockDiscoveryDocument));

    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const result = await service.getDocument();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.issuer).toBe(ISSUER_URL);
      expect(result.value.token_endpoint).toBe('https://esignet.mosip.io/oauth/token');
    }

    expect(mockFetch).not.toHaveBeenCalled();
    expect(redis.get).toHaveBeenCalledWith('oidc:discovery');
  });

  it('re-fetches after invalidateCache() is called', async () => {
    // First call — populate cache
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDiscoveryDocument),
    });
    vi.stubGlobal('fetch', mockFetch);

    await service.getDocument();
    expect(mockFetch).toHaveBeenCalledOnce();

    // Invalidate cache
    await service.invalidateCache();
    expect(redis.del).toHaveBeenCalledWith('oidc:discovery');

    // Redis returns null after invalidation
    redis.get.mockResolvedValue(null);

    // Second call — should fetch again
    const result = await service.getDocument();
    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('returns error when issuer URL is unreachable', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    vi.stubGlobal('fetch', mockFetch);

    const result = await service.getDocument();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Failed to fetch OIDC discovery document');
    }

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(redis.set).not.toHaveBeenCalled();
  });
});

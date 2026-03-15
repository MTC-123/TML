import { z } from 'zod';
import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import { ValidationError } from '@tml/types';

interface RedisClient {
  set(key: string, value: string, option?: string, ttl?: number): Promise<unknown>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
}

const CACHE_KEY = 'oidc:discovery';
const CACHE_TTL = 3600; // 1 hour

const oidcDiscoverySchema = z.object({
  issuer: z.string(),
  authorization_endpoint: z.string().url(),
  token_endpoint: z.string().url(),
  userinfo_endpoint: z.string().url().optional(),
  jwks_uri: z.string().url(),
  scopes_supported: z.array(z.string()).optional(),
  response_types_supported: z.array(z.string()).optional(),
  acr_values_supported: z.array(z.string()).optional(),
  token_endpoint_auth_methods_supported: z.array(z.string()).optional(),
});

export type OidcDiscoveryDocument = z.infer<typeof oidcDiscoverySchema>;

export class OidcDiscoveryService {
  constructor(
    private redis: RedisClient,
    private issuerUrl: string,
  ) {}

  async getDocument(): Promise<Result<OidcDiscoveryDocument>> {
    // Check Redis cache
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) {
      const parsed = oidcDiscoverySchema.safeParse(JSON.parse(cached));
      if (parsed.success) {
        return ok(parsed.data);
      }
      // Cached data is invalid — clear and re-fetch
      await this.redis.del(CACHE_KEY);
    }

    // Fetch from well-known endpoint
    const discoveryUrl = `${this.issuerUrl}/.well-known/openid-configuration`;
    let response: Response;
    try {
      response = await fetch(discoveryUrl);
    } catch {
      return err(new ValidationError('Failed to fetch OIDC discovery document', {
        url: discoveryUrl,
      }));
    }

    if (!response.ok) {
      return err(new ValidationError('OIDC discovery endpoint returned error', {
        status: response.status,
        url: discoveryUrl,
      }));
    }

    const body = await response.json();
    const parsed = oidcDiscoverySchema.safeParse(body);
    if (!parsed.success) {
      return err(new ValidationError('Invalid OIDC discovery document', {
        errors: parsed.error.format(),
      }));
    }

    // Cache in Redis
    await this.redis.set(CACHE_KEY, JSON.stringify(parsed.data), 'EX', CACHE_TTL);

    return ok(parsed.data);
  }

  async getTokenEndpoint(): Promise<Result<string>> {
    const docResult = await this.getDocument();
    if (!docResult.ok) return docResult;
    return ok(docResult.value.token_endpoint);
  }

  async getAuthorizationEndpoint(): Promise<Result<string>> {
    const docResult = await this.getDocument();
    if (!docResult.ok) return docResult;
    return ok(docResult.value.authorization_endpoint);
  }

  async invalidateCache(): Promise<void> {
    await this.redis.del(CACHE_KEY);
  }
}

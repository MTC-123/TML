import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import type { Actor, ActorRole } from '@tml/types';
import { NotFoundError, ValidationError } from '@tml/types';
import { generateKeyPair, createDID, sha256Hex, signPayload, base58 } from '@tml/crypto';
import type { ActorsRepository } from '../repositories/actors.repository.js';
import type { OidcDiscoveryService } from './oidc-discovery.service.js';
import type { Env } from '../config/env.js';

interface RedisClient {
  set(key: string, value: string, option?: string, ttl?: number): Promise<unknown>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
}

interface JwtSigner {
  sign(payload: Record<string, unknown>, options?: { expiresIn?: string }): string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  actor: Actor;
}

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  constructor(
    private actorsRepo: ActorsRepository,
    private redis: RedisClient,
    private jwt: JwtSigner,
    private env: Env,
    private oidcDiscovery?: OidcDiscoveryService,
  ) {}

  async getLoginUrl(): Promise<Result<string>> {
    // Resolve authorization endpoint from OIDC discovery if available
    let authorizeEndpoint = `${this.env.MOSIP_ISSUER_URL}/authorize`;
    if (this.oidcDiscovery) {
      const epResult = await this.oidcDiscovery.getAuthorizationEndpoint();
      if (epResult.ok) {
        authorizeEndpoint = epResult.value;
      }
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.env.MOSIP_CLIENT_ID,
      redirect_uri: this.env.MOSIP_REDIRECT_URI,
      scope: 'openid profile',
    });
    const url = `${authorizeEndpoint}?${params.toString()}`;
    return ok(url);
  }

  async handleCallback(code: string): Promise<Result<AuthTokens>> {
    // Resolve token endpoint from OIDC discovery if available
    let tokenUrl = `${this.env.MOSIP_ISSUER_URL}/oauth/token`;
    if (this.oidcDiscovery) {
      const epResult = await this.oidcDiscovery.getTokenEndpoint();
      if (epResult.ok) {
        tokenUrl = epResult.value;
      }
    }

    // Build token request body
    const bodyParams: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      client_id: this.env.MOSIP_CLIENT_ID,
      redirect_uri: this.env.MOSIP_REDIRECT_URI,
    };

    // Use private_key_jwt if MOSIP_CLIENT_PRIVATE_KEY_HEX is set, otherwise fall back to client_secret
    if (this.env.MOSIP_CLIENT_PRIVATE_KEY_HEX) {
      const clientAssertion = this.buildClientAssertion(tokenUrl);
      bodyParams['client_assertion_type'] = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
      bodyParams['client_assertion'] = clientAssertion;
    } else if (this.env.MOSIP_CLIENT_SECRET) {
      bodyParams['client_secret'] = this.env.MOSIP_CLIENT_SECRET;
    }

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(bodyParams).toString(),
    });

    if (!tokenResponse.ok) {
      return err(new ValidationError('Failed to exchange authorization code', {
        status: tokenResponse.status,
      }));
    }

    const tokenData = await tokenResponse.json() as { id_token?: string };
    if (!tokenData.id_token) {
      return err(new ValidationError('No ID token in MOSIP response'));
    }

    // Decode ID token to extract CNIE hash and ACR (base64url-decode the payload)
    const parts = tokenData.id_token.split('.');
    if (parts.length !== 3) {
      return err(new ValidationError('Invalid ID token format'));
    }

    const payload = JSON.parse(
      Buffer.from(parts[1]!, 'base64url').toString('utf-8'),
    ) as { sub?: string; cnie_hash?: string; acr?: string };

    const cnieIdentifier = payload.cnie_hash ?? payload.sub;
    if (!cnieIdentifier) {
      return err(new ValidationError('No identity claim in ID token'));
    }

    const cnieHash = sha256Hex(cnieIdentifier);
    const acr = payload.acr ?? null;

    // Map ACR to assurance level
    const assuranceLevel = this.mapAcrToAssuranceLevel(acr);

    // Look up or create actor
    let actor = await this.actorsRepo.findByCnieHash(cnieHash);
    if (!actor) {
      const keyPair = generateKeyPair();
      const did = createDID(keyPair.publicKey);
      actor = await this.actorsRepo.create({
        did,
        cnieHash,
        roles: ['citizen' as ActorRole],
      });
    }

    // Update assurance level if ACR is present
    if (acr) {
      actor = await this.actorsRepo.updateAssurance(actor.id, assuranceLevel, acr);
    }

    // Generate JWT access token
    const accessToken = this.jwt.sign({
      sub: actor.did,
      did: actor.did,
      roles: actor.roles,
      actorId: actor.id,
      acr: acr ?? undefined,
      assuranceLevel,
    });

    // Generate refresh token and store in Redis
    const refreshToken = sha256Hex(`${actor.id}:${Date.now()}:${Math.random()}`);
    const refreshTtl = this.parseExpiresIn(this.env.JWT_REFRESH_EXPIRES_IN);
    await this.redis.set(`refresh:${refreshToken}`, actor.id, 'EX', refreshTtl);

    return ok({ accessToken, refreshToken, actor });
  }

  async refreshToken(refreshToken: string): Promise<Result<RefreshResult>> {
    const actorId = await this.redis.get(`refresh:${refreshToken}`);
    if (!actorId) {
      return err(new ValidationError('Invalid or expired refresh token'));
    }

    const actor = await this.actorsRepo.findById(actorId);
    if (!actor) {
      await this.redis.del(`refresh:${refreshToken}`);
      return err(new NotFoundError('Actor', actorId));
    }

    // Delete old refresh token
    await this.redis.del(`refresh:${refreshToken}`);

    // Issue new tokens
    const newAccessToken = this.jwt.sign({
      sub: actor.did,
      did: actor.did,
      roles: actor.roles,
      actorId: actor.id,
    });

    const newRefreshToken = sha256Hex(`${actor.id}:${Date.now()}:${Math.random()}`);
    const refreshTtl = this.parseExpiresIn(this.env.JWT_REFRESH_EXPIRES_IN);
    await this.redis.set(`refresh:${newRefreshToken}`, actor.id, 'EX', refreshTtl);

    return ok({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  }

  async getProfile(actorId: string): Promise<Result<Actor>> {
    const actor = await this.actorsRepo.findById(actorId);
    if (!actor) {
      return err(new NotFoundError('Actor', actorId));
    }
    return ok(actor);
  }

  async logout(_actorId: string): Promise<Result<void>> {
    // Scan and delete all refresh tokens for this actor is expensive.
    // Instead we rely on the specific refresh token being deleted on refresh.
    // For a full logout, the client should also send the refresh token.
    // Here we do a best-effort approach.
    return ok(undefined);
  }

  async logoutWithToken(refreshToken: string): Promise<Result<void>> {
    await this.redis.del(`refresh:${refreshToken}`);
    return ok(undefined);
  }

  private buildClientAssertion(tokenEndpointUrl: string): string {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'EdDSA', typ: 'JWT' };
    const assertionPayload = {
      iss: this.env.MOSIP_CLIENT_ID,
      sub: this.env.MOSIP_CLIENT_ID,
      aud: tokenEndpointUrl,
      exp: now + 120, // 2 minute expiry
      iat: now,
      jti: sha256Hex(`${now}:${Math.random()}`),
    };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(assertionPayload)).toString('base64url');
    const signingInput = `${headerB64}.${payloadB64}`;

    const privateKeyBytes = Buffer.from(this.env.MOSIP_CLIENT_PRIVATE_KEY_HEX!, 'hex');
    const signatureB58 = signPayload(
      new TextEncoder().encode(signingInput),
      privateKeyBytes,
    );

    // Convert base58 signature to base64url for JWT
    const sigBytes = base58.decode(signatureB58);
    const signatureB64url = Buffer.from(sigBytes).toString('base64url');

    return `${signingInput}.${signatureB64url}`;
  }

  private mapAcrToAssuranceLevel(acr: string | null): string {
    if (!acr) return 'low';
    if (acr.includes('biometrics') || acr.includes('biometric')) return 'high';
    if (acr.includes('generated-code') || acr.includes('otp')) return 'substantial';
    if (acr.includes('password')) return 'low';
    return 'low';
  }

  private parseExpiresIn(value: string): number {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return 604800; // default 7 days
    const num = parseInt(match[1]!, 10);
    switch (match[2]) {
      case 's': return num;
      case 'm': return num * 60;
      case 'h': return num * 3600;
      case 'd': return num * 86400;
      default: return 604800;
    }
  }
}

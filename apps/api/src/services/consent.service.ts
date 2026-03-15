import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import type { ConsentRecord, ConsentPurpose } from '@tml/types';
import { NotFoundError, ConflictError } from '@tml/types';
import type { ConsentRepository } from '../repositories/consent.repository.js';

const DEFAULT_TTL_DAYS = 365;

export class ConsentService {
  constructor(private repo: ConsentRepository) {}

  async grantConsent(params: {
    actorId: string;
    actorDid: string;
    purpose: ConsentPurpose;
    scope: string;
    legalBasis: string;
    ipAddress?: string;
    userAgent?: string;
    ttlDays?: number;
  }): Promise<Result<ConsentRecord>> {
    // Check if consent already exists for actor+purpose
    const existing = await this.repo.findByActorAndPurpose(
      params.actorId,
      params.purpose,
    );

    if (existing && existing.status === 'granted') {
      // If not expired, return existing
      if (!existing.expiresAt || existing.expiresAt > new Date()) {
        return ok(existing);
      }
    }

    // Calculate expiresAt
    const ttlDays = params.ttlDays ?? DEFAULT_TTL_DAYS;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    // If a record exists (revoked/expired), update it instead of creating
    if (existing) {
      const updated = await this.repo.update(existing.id, {
        status: 'granted',
        revokedAt: null,
        expiresAt,
      });
      return ok(updated);
    }

    const record = await this.repo.create({
      actorId: params.actorId,
      actorDid: params.actorDid,
      purpose: params.purpose,
      scope: params.scope,
      legalBasis: params.legalBasis,
      status: 'granted',
      expiresAt,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    });

    return ok(record);
  }

  async revokeConsent(
    actorId: string,
    purpose: ConsentPurpose,
  ): Promise<Result<void>> {
    const existing = await this.repo.findByActorAndPurpose(actorId, purpose);
    if (!existing) {
      return err(new NotFoundError('ConsentRecord', `${actorId}:${purpose}`));
    }

    if (existing.status === 'revoked') {
      return err(
        new ConflictError('Consent is already revoked', {
          actorId,
          purpose,
        }),
      );
    }

    await this.repo.update(existing.id, {
      status: 'revoked',
      revokedAt: new Date(),
    });

    return ok(undefined);
  }

  async checkConsent(
    actorId: string,
    purpose: ConsentPurpose,
  ): Promise<boolean> {
    const existing = await this.repo.findByActorAndPurpose(actorId, purpose);
    if (!existing) return false;
    if (existing.status !== 'granted') return false;
    if (existing.expiresAt && existing.expiresAt <= new Date()) return false;
    return true;
  }

  async getConsents(actorId: string): Promise<Result<ConsentRecord[]>> {
    const records = await this.repo.findByActorId(actorId);
    return ok(records);
  }
}

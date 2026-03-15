import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsentService } from './consent.service.js';
import type { ConsentRecord, ConsentPurpose } from '@tml/types';
import type { ConsentRepository } from '../repositories/consent.repository.js';

function createMockConsentRecord(overrides?: Partial<ConsentRecord>): ConsentRecord {
  return {
    id: 'consent-1',
    actorId: 'actor-1',
    actorDid: 'did:key:z6MkTest',
    purpose: 'attestation_submission' as ConsentPurpose,
    scope: 'milestone:*',
    legalBasis: 'explicit_consent',
    status: 'granted',
    grantedAt: new Date('2025-06-01'),
    expiresAt: new Date('2026-06-01'),
    revokedAt: null,
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    ...overrides,
  };
}

function createMockRepo(): {
  [K in keyof ConsentRepository]: ReturnType<typeof vi.fn>;
} {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByActorId: vi.fn(),
    findByActorAndPurpose: vi.fn(),
    update: vi.fn(),
  };
}

describe('ConsentService', () => {
  let repo: ReturnType<typeof createMockRepo>;
  let service: ConsentService;

  beforeEach(() => {
    vi.restoreAllMocks();
    repo = createMockRepo();
    service = new ConsentService(repo as unknown as ConsentRepository);
  });

  describe('grantConsent()', () => {
    it('creates consent record with correct purpose and scope', async () => {
      const expected = createMockConsentRecord();
      repo.findByActorAndPurpose.mockResolvedValue(null);
      repo.create.mockResolvedValue(expected);

      const result = await service.grantConsent({
        actorId: 'actor-1',
        actorDid: 'did:key:z6MkTest',
        purpose: 'attestation_submission',
        scope: 'milestone:*',
        legalBasis: 'explicit_consent',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.purpose).toBe('attestation_submission');
        expect(result.value.scope).toBe('milestone:*');
      }

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'actor-1',
          actorDid: 'did:key:z6MkTest',
          purpose: 'attestation_submission',
          scope: 'milestone:*',
          legalBasis: 'explicit_consent',
          status: 'granted',
        }),
      );
    });
  });

  describe('revokeConsent()', () => {
    it('updates status to revoked and sets revokedAt', async () => {
      const existing = createMockConsentRecord();
      repo.findByActorAndPurpose.mockResolvedValue(existing);
      repo.update.mockResolvedValue(
        createMockConsentRecord({ status: 'revoked', revokedAt: new Date() }),
      );

      const result = await service.revokeConsent('actor-1', 'attestation_submission');

      expect(result.ok).toBe(true);
      expect(repo.update).toHaveBeenCalledWith(
        'consent-1',
        expect.objectContaining({
          status: 'revoked',
          revokedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('checkConsent()', () => {
    it('returns true for granted consent', async () => {
      const existing = createMockConsentRecord({
        status: 'granted',
        expiresAt: new Date(Date.now() + 86_400_000), // tomorrow
      });
      repo.findByActorAndPurpose.mockResolvedValue(existing);

      const result = await service.checkConsent('actor-1', 'attestation_submission');

      expect(result).toBe(true);
    });

    it('returns false for revoked consent', async () => {
      const existing = createMockConsentRecord({
        status: 'revoked',
        revokedAt: new Date(),
      });
      repo.findByActorAndPurpose.mockResolvedValue(existing);

      const result = await service.checkConsent('actor-1', 'attestation_submission');

      expect(result).toBe(false);
    });

    it('returns false for expired consent', async () => {
      const existing = createMockConsentRecord({
        status: 'granted',
        expiresAt: new Date('2020-01-01'), // already expired
      });
      repo.findByActorAndPurpose.mockResolvedValue(existing);

      const result = await service.checkConsent('actor-1', 'attestation_submission');

      expect(result).toBe(false);
    });
  });
});

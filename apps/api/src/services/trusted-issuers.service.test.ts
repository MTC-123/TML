import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrustedIssuersService } from './trusted-issuers.service.js';
import type { TrustedIssuerRegistry } from '@tml/types';
import type { TrustedIssuersRepository } from '../repositories/trusted-issuers.repository.js';

// --- Helpers ---

function createMockIssuer(overrides?: Partial<TrustedIssuerRegistry>): TrustedIssuerRegistry {
  return {
    id: 'issuer-1',
    issuerDid: 'did:key:z6MkIssuer',
    issuerName: 'Test Issuer Authority',
    credentialTypes: ['ProfessionalEngineerCredential', 'AuditorAccreditationCredential'],
    active: true,
    revocationReason: null,
    activatedAt: new Date('2026-01-01'),
    revokedAt: null,
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function createMockRepo(): {
  [K in keyof TrustedIssuersRepository]: ReturnType<typeof vi.fn>;
} {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByDid: vi.fn(),
    create: vi.fn(),
    findActive: vi.fn(),
    revoke: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  };
}

// --- Tests ---

describe('TrustedIssuersService', () => {
  let service: TrustedIssuersService;
  let repo: ReturnType<typeof createMockRepo>;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = createMockRepo();
    service = new TrustedIssuersService(
      repo as unknown as TrustedIssuersRepository,
    );
  });

  describe('register', () => {
    it('should register a new trusted issuer', async () => {
      const mockIssuer = createMockIssuer();
      repo.findByDid.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockIssuer);

      const result = await service.register({
        issuerDid: 'did:key:z6MkIssuer',
        issuerName: 'Test Issuer Authority',
        credentialTypes: ['ProfessionalEngineerCredential', 'AuditorAccreditationCredential'],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockIssuer);
        expect(result.value.issuerDid).toBe('did:key:z6MkIssuer');
        expect(result.value.active).toBe(true);
      }
      expect(repo.findByDid).toHaveBeenCalledWith('did:key:z6MkIssuer');
      expect(repo.create).toHaveBeenCalledWith({
        issuerDid: 'did:key:z6MkIssuer',
        issuerName: 'Test Issuer Authority',
        credentialTypes: ['ProfessionalEngineerCredential', 'AuditorAccreditationCredential'],
      });
    });

    it('should reject duplicate issuer DID', async () => {
      const existingIssuer = createMockIssuer();
      repo.findByDid.mockResolvedValue(existingIssuer);

      const result = await service.register({
        issuerDid: 'did:key:z6MkIssuer',
        issuerName: 'Duplicate Issuer',
        credentialTypes: ['ProfessionalEngineerCredential'],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('already exists');
        expect(result.error.message).toContain('did:key:z6MkIssuer');
      }
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should list all trusted issuers', async () => {
      const issuers = [
        createMockIssuer({ id: 'issuer-1', issuerName: 'Issuer A' }),
        createMockIssuer({ id: 'issuer-2', issuerName: 'Issuer B', issuerDid: 'did:key:z6MkIssuer2' }),
        createMockIssuer({ id: 'issuer-3', issuerName: 'Issuer C', issuerDid: 'did:key:z6MkIssuer3', active: false }),
      ];
      repo.findAll.mockResolvedValue(issuers);

      const result = await service.list();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(3);
        expect(result.value[0].issuerName).toBe('Issuer A');
        expect(result.value[2].active).toBe(false);
      }
      expect(repo.findAll).toHaveBeenCalledOnce();
    });

    it('should return empty array when no issuers exist', async () => {
      repo.findAll.mockResolvedValue([]);

      const result = await service.list();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe('remove', () => {
    it('should remove a trusted issuer', async () => {
      const existingIssuer = createMockIssuer();
      repo.findById.mockResolvedValue(existingIssuer);
      repo.update.mockResolvedValue({
        ...existingIssuer,
        active: false,
        revocationReason: 'Removed by administrator',
        revokedAt: new Date(),
      });

      const result = await service.remove('issuer-1');

      expect(result.ok).toBe(true);
      expect(repo.findById).toHaveBeenCalledWith('issuer-1');
      expect(repo.update).toHaveBeenCalledWith(
        'issuer-1',
        expect.objectContaining({
          active: false,
          revocationReason: 'Removed by administrator',
        }),
      );
    });

    it('should return not found when removing non-existent issuer', async () => {
      repo.findById.mockResolvedValue(null);

      const result = await service.remove('issuer-nonexistent');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('TrustedIssuer');
        expect(result.error.message).toContain('issuer-nonexistent');
      }
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('isAuthorized', () => {
    it('should return true when issuer is active and has the credential type', async () => {
      const issuer = createMockIssuer({
        active: true,
        credentialTypes: ['ProfessionalEngineerCredential', 'AuditorAccreditationCredential'],
      });
      repo.findByDid.mockResolvedValue(issuer);

      const authorized = await service.isAuthorized(
        'did:key:z6MkIssuer',
        'ProfessionalEngineerCredential',
      );

      expect(authorized).toBe(true);
      expect(repo.findByDid).toHaveBeenCalledWith('did:key:z6MkIssuer');
    });

    it('should return false when issuer does not exist', async () => {
      repo.findByDid.mockResolvedValue(null);

      const authorized = await service.isAuthorized(
        'did:key:z6MkUnknown',
        'ProfessionalEngineerCredential',
      );

      expect(authorized).toBe(false);
    });

    it('should return false when issuer is inactive', async () => {
      const issuer = createMockIssuer({ active: false });
      repo.findByDid.mockResolvedValue(issuer);

      const authorized = await service.isAuthorized(
        'did:key:z6MkIssuer',
        'ProfessionalEngineerCredential',
      );

      expect(authorized).toBe(false);
    });

    it('should return false when issuer lacks the credential type', async () => {
      const issuer = createMockIssuer({
        active: true,
        credentialTypes: ['CNIEIdentityCredential'],
      });
      repo.findByDid.mockResolvedValue(issuer);

      const authorized = await service.isAuthorized(
        'did:key:z6MkIssuer',
        'ProfessionalEngineerCredential',
      );

      expect(authorized).toBe(false);
    });
  });
});

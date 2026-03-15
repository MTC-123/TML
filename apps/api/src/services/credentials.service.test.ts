import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CredentialsService } from './credentials.service.js';
import type { IssuedCredential } from '@tml/types';
import type { IssuedCredentialsRepository } from '../repositories/issued-credentials.repository.js';
import type { TrustedIssuersRepository } from '../repositories/trusted-issuers.repository.js';
import type { Env } from '../config/env.js';
import type { CredentialType } from '@tml/crypto';

// --- Mock @tml/crypto ---

vi.mock('@tml/crypto', () => ({
  issueCredential: vi.fn().mockReturnValue({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'ProfessionalEngineerCredential'],
    issuer: 'did:key:z6Mock',
    issuanceDate: '2026-01-01T00:00:00.000Z',
    credentialSubject: {
      id: 'did:key:z6Holder',
      licenseNumber: 'LIC-001',
      specialization: 'civil',
      issuingAuthority: 'TML System',
    },
    proof: { type: 'Ed25519Signature2020', proofValue: 'mockproof' },
  }),
  verifyCredential: vi.fn().mockReturnValue({ valid: true, errors: [] }),
  sha256Hex: vi.fn().mockReturnValue('mockhash'),
  keyPairFromPrivateKey: vi.fn().mockReturnValue({
    publicKey: new Uint8Array(32),
    privateKey: new Uint8Array(64),
  }),
  createDID: vi.fn().mockReturnValue('did:key:z6Mock'),
}));

// --- Helpers ---

function createMockCredential(overrides?: Partial<IssuedCredential>): IssuedCredential {
  return {
    id: 'cred-1',
    holderDid: 'did:key:z6Holder',
    holderActorId: 'actor-1',
    credentialType: 'ProfessionalEngineerCredential',
    credentialJson: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'ProfessionalEngineerCredential'],
      issuer: 'did:key:z6Mock',
      credentialSubject: { id: 'did:key:z6Holder' },
    },
    credentialHash: 'mockhash',
    status: 'active',
    revocationReason: null,
    issuedAt: new Date('2026-01-01'),
    expiresAt: null,
    revokedAt: null,
    ...overrides,
  };
}

function createMockCredentialsRepo(): {
  [K in keyof IssuedCredentialsRepository]: ReturnType<typeof vi.fn>;
} {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByHash: vi.fn(),
    findByHolder: vi.fn(),
    revoke: vi.fn(),
  };
}

function createMockTrustedIssuersRepo(): {
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

function createMockEnv(): Env {
  return {
    SYSTEM_SIGNING_KEY_HEX: 'a'.repeat(64),
  } as unknown as Env;
}

// --- Tests ---

describe('CredentialsService', () => {
  let service: CredentialsService;
  let credentialsRepo: ReturnType<typeof createMockCredentialsRepo>;
  let trustedIssuersRepo: ReturnType<typeof createMockTrustedIssuersRepo>;
  let env: Env;

  beforeEach(() => {
    vi.clearAllMocks();
    credentialsRepo = createMockCredentialsRepo();
    trustedIssuersRepo = createMockTrustedIssuersRepo();
    env = createMockEnv();
    service = new CredentialsService(
      credentialsRepo as unknown as IssuedCredentialsRepository,
      trustedIssuersRepo as unknown as TrustedIssuersRepository,
      env,
    );
  });

  describe('issue', () => {
    it('should issue a credential successfully', async () => {
      const mockStored = createMockCredential();

      trustedIssuersRepo.findByDid.mockResolvedValue({
        id: 'issuer-1',
        issuerDid: 'did:key:z6Mock',
        issuerName: 'TML System',
        credentialTypes: ['ProfessionalEngineerCredential'],
        active: true,
        revocationReason: null,
        activatedAt: new Date('2026-01-01'),
        revokedAt: null,
        updatedAt: new Date('2026-01-01'),
      });
      credentialsRepo.create.mockResolvedValue(mockStored);

      const result = await service.issue({
        type: 'ProfessionalEngineerCredential',
        holderDid: 'did:key:z6Holder',
        actorId: 'actor-1',
        metadata: { licenseNumber: 'LIC-001', specialization: 'civil' },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockStored);
      }
      expect(credentialsRepo.create).toHaveBeenCalledOnce();
      expect(credentialsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          holderDid: 'did:key:z6Holder',
          holderActorId: 'actor-1',
          credentialType: 'ProfessionalEngineerCredential',
          credentialHash: 'mockhash',
        }),
      );
    });

    it('should reject issuance when no plugin registered for type', async () => {
      const result = await service.issue({
        type: 'UnknownCredentialType' as CredentialType,
        holderDid: 'did:key:z6Holder',
        actorId: 'actor-1',
        metadata: {},
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('No plugin registered for credential type');
      }
      expect(credentialsRepo.create).not.toHaveBeenCalled();
    });

    it('should reject issuance when system DID is not a trusted issuer', async () => {
      trustedIssuersRepo.findByDid.mockResolvedValue(null);

      const result = await service.issue({
        type: 'ProfessionalEngineerCredential',
        holderDid: 'did:key:z6Holder',
        actorId: 'actor-1',
        metadata: { licenseNumber: 'LIC-001' },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('is not authorized to issue');
      }
      expect(credentialsRepo.create).not.toHaveBeenCalled();
    });

    it('should reject issuance when trusted issuer is inactive', async () => {
      trustedIssuersRepo.findByDid.mockResolvedValue({
        id: 'issuer-1',
        issuerDid: 'did:key:z6Mock',
        issuerName: 'TML System',
        credentialTypes: ['ProfessionalEngineerCredential'],
        active: false,
        revocationReason: 'Revoked',
        activatedAt: new Date('2026-01-01'),
        revokedAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-01'),
      });

      const result = await service.issue({
        type: 'ProfessionalEngineerCredential',
        holderDid: 'did:key:z6Holder',
        actorId: 'actor-1',
        metadata: {},
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('is not authorized to issue');
      }
    });

    it('should reject issuance when issuer lacks the credential type', async () => {
      trustedIssuersRepo.findByDid.mockResolvedValue({
        id: 'issuer-1',
        issuerDid: 'did:key:z6Mock',
        issuerName: 'TML System',
        credentialTypes: ['CNIEIdentityCredential'],
        active: true,
        revocationReason: null,
        activatedAt: new Date('2026-01-01'),
        revokedAt: null,
        updatedAt: new Date('2026-01-01'),
      });

      const result = await service.issue({
        type: 'ProfessionalEngineerCredential',
        holderDid: 'did:key:z6Holder',
        actorId: 'actor-1',
        metadata: {},
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('is not authorized to issue');
      }
    });
  });

  describe('revoke', () => {
    it('should revoke a credential', async () => {
      const mockCred = createMockCredential({ status: 'active' });
      credentialsRepo.findById.mockResolvedValue(mockCred);
      credentialsRepo.revoke.mockResolvedValue({
        ...mockCred,
        status: 'revoked',
        revocationReason: 'Policy violation',
        revokedAt: new Date(),
      });

      const result = await service.revoke('cred-1', 'Policy violation');

      expect(result.ok).toBe(true);
      expect(credentialsRepo.revoke).toHaveBeenCalledWith('cred-1', 'Policy violation');
    });

    it('should reject revoking already revoked credential', async () => {
      const mockCred = createMockCredential({
        status: 'revoked',
        revocationReason: 'Already revoked',
        revokedAt: new Date('2026-02-01'),
      });
      credentialsRepo.findById.mockResolvedValue(mockCred);

      const result = await service.revoke('cred-1', 'Another reason');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('already revoked');
      }
      expect(credentialsRepo.revoke).not.toHaveBeenCalled();
    });

    it('should return not found when revoking non-existent credential', async () => {
      credentialsRepo.findById.mockResolvedValue(null);

      const result = await service.revoke('cred-nonexistent', 'Some reason');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('IssuedCredential');
      }
    });
  });

  describe('verify', () => {
    it('should verify a credential', async () => {
      const { verifyCredential } = await import('@tml/crypto');
      const mockCred = createMockCredential({ status: 'active' });
      credentialsRepo.findById.mockResolvedValue(mockCred);
      vi.mocked(verifyCredential).mockReturnValue({ valid: true, errors: [] });

      const result = await service.verify('cred-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.valid).toBe(true);
        expect(result.value.errors).toEqual([]);
      }
      expect(verifyCredential).toHaveBeenCalledWith(mockCred.credentialJson);
    });

    it('should return revoked status without calling verifyCredential', async () => {
      const { verifyCredential } = await import('@tml/crypto');
      const mockCred = createMockCredential({
        status: 'revoked',
        revocationReason: 'Policy violation',
      });
      credentialsRepo.findById.mockResolvedValue(mockCred);

      const result = await service.verify('cred-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.valid).toBe(false);
        expect(result.value.errors).toContain('Credential has been revoked');
      }
      expect(verifyCredential).not.toHaveBeenCalled();
    });

    it('should return not found for non-existent credential', async () => {
      credentialsRepo.findById.mockResolvedValue(null);

      const result = await service.verify('cred-nonexistent');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('IssuedCredential');
      }
    });
  });

  describe('getByHolder', () => {
    it('should get credentials by holder DID', async () => {
      const creds = [
        createMockCredential({ id: 'cred-1' }),
        createMockCredential({ id: 'cred-2', credentialType: 'AuditorAccreditationCredential' }),
      ];
      credentialsRepo.findByHolder.mockResolvedValue(creds);

      const result = await service.getByHolder('did:key:z6Holder');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].id).toBe('cred-1');
        expect(result.value[1].id).toBe('cred-2');
      }
      expect(credentialsRepo.findByHolder).toHaveBeenCalledWith('did:key:z6Holder');
    });

    it('should return empty array when holder has no credentials', async () => {
      credentialsRepo.findByHolder.mockResolvedValue([]);

      const result = await service.getByHolder('did:key:z6Unknown');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe('getById', () => {
    it('should get a credential by ID', async () => {
      const mockCred = createMockCredential();
      credentialsRepo.findById.mockResolvedValue(mockCred);

      const result = await service.getById('cred-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockCred);
      }
    });

    it('should return not found for non-existent credential', async () => {
      credentialsRepo.findById.mockResolvedValue(null);

      const result = await service.getById('cred-nonexistent');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('IssuedCredential');
      }
    });
  });
});

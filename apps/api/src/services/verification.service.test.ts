import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerificationService } from './verification.service.js';
import type { CertificatesRepository } from '../repositories/certificates.repository.js';
import type { MilestonesRepository } from '../repositories/milestones.repository.js';
import type { ProjectsRepository } from '../repositories/projects.repository.js';
import type { ComplianceCertificate, Milestone, Project } from '@tml/types';

// --- Mock @tml/crypto ---

vi.mock('@tml/crypto', () => ({
  decodeQrPayload: vi.fn(),
  validateQrPayloadIntegrity: vi.fn(),
  verifyPresentation: vi.fn().mockReturnValue({ valid: true, presentationErrors: [] }),
  sha256Hex: vi.fn().mockReturnValue('mockpdid'),
}));

// --- Helpers ---

function createMockCertificate(overrides?: Partial<ComplianceCertificate>): ComplianceCertificate {
  return {
    id: 'cert-1',
    milestoneId: 'milestone-1',
    certificateHash: 'a'.repeat(64),
    digitalSignature: 'sig1234567890abcdef_fullsig',
    status: 'issued',
    tgrReference: null,
    revocationReason: null,
    issuedAt: new Date('2026-01-15'),
    revokedAt: null,
    ...overrides,
  };
}

function createMockMilestone(overrides?: Partial<Milestone>): Milestone {
  return {
    id: 'milestone-1',
    projectId: 'project-1',
    sequenceNumber: 1,
    description: 'Foundation poured',
    deadline: new Date('2026-06-01'),
    status: 'completed',
    requiredInspectorCount: 1,
    requiredAuditorCount: 1,
    requiredCitizenCount: 3,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-10'),
    deletedAt: null,
    ...overrides,
  };
}

function createMockProject(overrides?: Partial<Project>): Project {
  return {
    id: 'project-1',
    name: 'School Construction',
    region: 'Casablanca-Settat',
    budget: '5000000',
    donor: null,
    status: 'active',
    boundary: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    ...overrides,
  };
}

function createMockCertificatesRepo(): {
  [K in keyof Pick<CertificatesRepository, 'findByHash' | 'findById' | 'findAll' | 'findByMilestoneId' | 'create' | 'update'>]: ReturnType<typeof vi.fn>;
} {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByHash: vi.fn(),
    findByMilestoneId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
}

function createMockMilestonesRepo(): {
  [K in 'findById']: ReturnType<typeof vi.fn>;
} {
  return {
    findById: vi.fn(),
  };
}

function createMockProjectsRepo(): {
  [K in 'findById']: ReturnType<typeof vi.fn>;
} {
  return {
    findById: vi.fn(),
  };
}

function createMockRedis(): {
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
} {
  return {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
  };
}

// --- Tests ---

describe('VerificationService', () => {
  let service: VerificationService;
  let certificatesRepo: ReturnType<typeof createMockCertificatesRepo>;
  let milestonesRepo: ReturnType<typeof createMockMilestonesRepo>;
  let projectsRepo: ReturnType<typeof createMockProjectsRepo>;
  let redis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    vi.clearAllMocks();
    certificatesRepo = createMockCertificatesRepo();
    milestonesRepo = createMockMilestonesRepo();
    projectsRepo = createMockProjectsRepo();
    redis = createMockRedis();
    service = new VerificationService(
      certificatesRepo as unknown as CertificatesRepository,
      milestonesRepo as unknown as MilestonesRepository,
      projectsRepo as unknown as ProjectsRepository,
      redis,
    );
  });

  describe('verifyCertificateByHash', () => {
    it('should return valid result for existing certificate', async () => {
      const mockCert = createMockCertificate();
      const mockMilestone = createMockMilestone();
      const mockProject = createMockProject();

      certificatesRepo.findByHash.mockResolvedValue(mockCert);
      milestonesRepo.findById.mockResolvedValue(mockMilestone);
      projectsRepo.findById.mockResolvedValue(mockProject);

      const result = await service.verifyCertificateByHash('a'.repeat(64));

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.valid).toBe(true);
        expect(result.value.certificate).toEqual(mockCert);
        expect(result.value.milestone).toEqual(mockMilestone);
        expect(result.value.project).toEqual(mockProject);
        expect(result.value.errors).toEqual([]);
      }
      expect(certificatesRepo.findByHash).toHaveBeenCalledWith('a'.repeat(64));
    });

    it('should return invalid for non-existent certificate', async () => {
      certificatesRepo.findByHash.mockResolvedValue(null);

      const result = await service.verifyCertificateByHash('nonexistent_hash');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.valid).toBe(false);
        expect(result.value.certificate).toBeNull();
        expect(result.value.errors).toContain('Certificate not found');
      }
    });

    it('should return invalid for revoked certificate', async () => {
      const revokedCert = createMockCertificate({
        status: 'revoked',
        revocationReason: 'Fraudulent attestation',
        revokedAt: new Date('2026-02-01'),
      });
      certificatesRepo.findByHash.mockResolvedValue(revokedCert);

      const result = await service.verifyCertificateByHash('a'.repeat(64));

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.valid).toBe(false);
        expect(result.value.certificate).toEqual(revokedCert);
        expect(result.value.errors).toContain('Certificate has been revoked');
      }
      // Should not attempt to look up milestone/project for revoked cert
      expect(milestonesRepo.findById).not.toHaveBeenCalled();
    });
  });

  describe('verifyQrPayload', () => {
    it('should return invalid for expired payload (> 24h old)', async () => {
      const { decodeQrPayload } = await import('@tml/crypto');
      const expiredTimestamp = Math.floor(Date.now() / 1000) - 86401; // 24h + 1s ago
      vi.mocked(decodeQrPayload).mockReturnValue({
        version: 1,
        type: 'CERT',
        hash: 'a'.repeat(64),
        signaturePrefix: 'sig1234567890ab',
        timestamp: expiredTimestamp,
        verifyUrl: 'https://tml.example.com/verify',
      });

      const result = await service.verifyQrPayload('{"payload":"TML:1:CERT:..."}');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.valid).toBe(false);
        expect(result.value.errors).toContain('QR payload has expired (older than 24 hours)');
      }
    });

    it('should return invalid for unsupported type', async () => {
      const { decodeQrPayload } = await import('@tml/crypto');
      const now = Math.floor(Date.now() / 1000);
      vi.mocked(decodeQrPayload).mockReturnValue({
        version: 1,
        type: 'ATTEST',
        hash: 'b'.repeat(64),
        signaturePrefix: 'sig1234567890ab',
        timestamp: now,
        verifyUrl: 'https://tml.example.com/verify',
      });

      const result = await service.verifyQrPayload('{"payload":"TML:1:ATTEST:..."}');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.valid).toBe(false);
        expect(result.value.errors).toContain('Unsupported QR payload type: ATTEST');
      }
    });
  });

  describe('createPresentationDefinition', () => {
    it('should generate correct structure', async () => {
      const result = await service.createPresentationDefinition({
        purpose: 'Verify inspector credentials',
        requiredCredentialTypes: ['ProfessionalEngineerCredential', 'CNIEIdentityCredential'],
        requiredAttributes: ['licenseNumber', 'specialization'],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const pd = result.value;
        expect(pd.id).toBe('mockpdid');
        expect(pd.name).toBe('Verify inspector credentials');
        expect(pd.purpose).toBe('Verify inspector credentials');
        expect(pd.input_descriptors).toHaveLength(2);

        // First descriptor
        expect(pd.input_descriptors[0].id).toBe('descriptor_0');
        expect(pd.input_descriptors[0].name).toBe('ProfessionalEngineerCredential');
        expect(pd.input_descriptors[0].purpose).toBe('Verify inspector credentials');
        expect(pd.input_descriptors[0].constraints.fields).toHaveLength(3); // type + 2 attributes
        expect(pd.input_descriptors[0].constraints.fields[0]).toEqual({
          path: ['$.type'],
          filter: { type: 'string', const: 'ProfessionalEngineerCredential' },
        });
        expect(pd.input_descriptors[0].constraints.fields[1]).toEqual({
          path: ['$.credentialSubject.licenseNumber'],
          purpose: 'Required attribute: licenseNumber',
        });

        // Second descriptor
        expect(pd.input_descriptors[1].id).toBe('descriptor_1');
        expect(pd.input_descriptors[1].name).toBe('CNIEIdentityCredential');
      }
    });
  });

  describe('validateAuthorizationResponse', () => {
    it('should return invalid for expired/missing state', async () => {
      redis.get.mockResolvedValue(null); // State not found in Redis

      const result = await service.validateAuthorizationResponse({
        vpToken: '{}',
        presentationSubmission: {
          id: 'sub-1',
          definition_id: 'pd-1',
          descriptor_map: [],
        },
        state: 'expired-or-invalid-state',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.valid).toBe(false);
        expect(result.value.presentationResult).toBeNull();
        expect(result.value.matchedAttributes).toEqual({});
        expect(result.value.errors).toContain('Invalid or expired state parameter');
      }
      expect(redis.get).toHaveBeenCalledWith('openid4vp:state:expired-or-invalid-state');
    });
  });
});

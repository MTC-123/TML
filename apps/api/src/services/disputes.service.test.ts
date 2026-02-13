import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisputesService } from './disputes.service.js';
import type { DisputeResolution, Milestone, ComplianceCertificate } from '@tml/types';

function mockRepo() {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByMilestoneId: vi.fn(),
    update: vi.fn(),
  };
}

function mockMilestonesRepo() {
  return {
    findById: vi.fn(),
    update: vi.fn(),
    findByProjectId: vi.fn(),
    findByProjectIdWithSummary: vi.fn(),
    findByIdWithAttestations: vi.fn(),
    create: vi.fn(),
    softDelete: vi.fn(),
    findActiveByProjectId: vi.fn(),
    findByProjectAndSequence: vi.fn(),
  };
}

function mockAuditorAssignmentsRepo() {
  return {
    findByMilestoneId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findByMilestoneAndAuditor: vi.fn(),
    getMaxRotationRound: vi.fn(),
    findRecentByProject: vi.fn(),
    findContractorActorIdsForProject: vi.fn(),
  };
}

function mockCertificatesRepo() {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByHash: vi.fn(),
    findByMilestoneId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
}

function mockWebhookDispatcher() {
  return {
    dispatch: vi.fn(),
    getDeadLetters: vi.fn(),
    clearDeadLetters: vi.fn(),
  };
}

function mockAuditLog() {
  return {
    log: vi.fn(),
    query: vi.fn(),
  };
}

const MILESTONE_ID = '11111111-1111-1111-1111-111111111111';
const DISPUTE_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const ACTOR_DID = 'did:key:z6MkTest';
const CERT_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

function makeMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: MILESTONE_ID,
    projectId: 'pppppppp-pppp-pppp-pppp-pppppppppppp',
    sequenceNumber: 1,
    description: 'Test milestone',
    deadline: new Date('2026-06-01'),
    status: 'completed',
    requiredInspectorCount: 1,
    requiredAuditorCount: 1,
    requiredCitizenCount: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function makeDispute(overrides: Partial<DisputeResolution> = {}): DisputeResolution {
  return {
    id: DISPUTE_ID,
    milestoneId: MILESTONE_ID,
    raisedById: 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr',
    reassignedAuditorId: null,
    reason: 'Poor quality work',
    status: 'open',
    resolutionNotes: null,
    raisedAt: new Date(),
    resolvedAt: null,
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeCert(overrides: Partial<ComplianceCertificate> = {}): ComplianceCertificate {
  return {
    id: CERT_ID,
    milestoneId: MILESTONE_ID,
    certificateHash: 'abc123',
    digitalSignature: 'sig123',
    status: 'issued',
    tgrReference: null,
    revocationReason: null,
    issuedAt: new Date(),
    revokedAt: null,
    ...overrides,
  };
}

describe('DisputesService', () => {
  let service: DisputesService;
  let repo: ReturnType<typeof mockRepo>;
  let milestonesRepo: ReturnType<typeof mockMilestonesRepo>;
  let auditorAssignmentsRepo: ReturnType<typeof mockAuditorAssignmentsRepo>;
  let certificatesRepo: ReturnType<typeof mockCertificatesRepo>;
  let webhookDispatcher: ReturnType<typeof mockWebhookDispatcher>;
  let auditLog: ReturnType<typeof mockAuditLog>;

  beforeEach(() => {
    repo = mockRepo();
    milestonesRepo = mockMilestonesRepo();
    auditorAssignmentsRepo = mockAuditorAssignmentsRepo();
    certificatesRepo = mockCertificatesRepo();
    webhookDispatcher = mockWebhookDispatcher();
    auditLog = mockAuditLog();

    service = new DisputesService(
      repo as any,
      milestonesRepo as any,
      auditorAssignmentsRepo as any,
      certificatesRepo as any,
      webhookDispatcher as any,
      auditLog as any,
    );
  });

  // ── Filing ──────────────────────────────────────────────────────────────

  describe('file()', () => {
    const input = { milestoneId: MILESTONE_ID, raisedById: 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', reason: 'Poor quality' };

    it('should file a dispute successfully', async () => {
      const dispute = makeDispute();
      milestonesRepo.findById.mockResolvedValue(makeMilestone());
      repo.create.mockResolvedValue(dispute);
      certificatesRepo.findByMilestoneId.mockResolvedValue(null);

      const result = await service.file(input, ACTOR_DID);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe(DISPUTE_ID);
      }
      expect(repo.create).toHaveBeenCalledWith(input);
    });

    it('should return error when milestone not found', async () => {
      milestonesRepo.findById.mockResolvedValue(null);

      const result = await service.file(input, ACTOR_DID);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Milestone');
      }
    });

    it('should return error when milestone status is not attestation_in_progress or completed', async () => {
      milestonesRepo.findById.mockResolvedValue(makeMilestone({ status: 'pending' as any }));

      const result = await service.file(input, ACTOR_DID);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('attestation_in_progress or completed');
      }
    });

    it('should allow filing when milestone is attestation_in_progress', async () => {
      const dispute = makeDispute();
      milestonesRepo.findById.mockResolvedValue(makeMilestone({ status: 'attestation_in_progress' }));
      repo.create.mockResolvedValue(dispute);
      certificatesRepo.findByMilestoneId.mockResolvedValue(null);

      const result = await service.file(input, ACTOR_DID);

      expect(result.ok).toBe(true);
    });

    // ── Certificate halt ─────────────────────────────────────────────────

    it('should revoke issued certificate when dispute is filed', async () => {
      const dispute = makeDispute();
      const cert = makeCert();
      milestonesRepo.findById.mockResolvedValue(makeMilestone());
      repo.create.mockResolvedValue(dispute);
      certificatesRepo.findByMilestoneId.mockResolvedValue(cert);
      certificatesRepo.update.mockResolvedValue({ ...cert, status: 'revoked' });

      await service.file(input, ACTOR_DID);

      expect(certificatesRepo.update).toHaveBeenCalledWith(
        CERT_ID,
        expect.objectContaining({
          status: 'revoked',
          revocationReason: `Dispute filed: ${DISPUTE_ID}`,
        }),
      );
    });

    it('should not error when no certificate exists for milestone', async () => {
      const dispute = makeDispute();
      milestonesRepo.findById.mockResolvedValue(makeMilestone());
      repo.create.mockResolvedValue(dispute);
      certificatesRepo.findByMilestoneId.mockResolvedValue(null);

      const result = await service.file(input, ACTOR_DID);

      expect(result.ok).toBe(true);
      expect(certificatesRepo.update).not.toHaveBeenCalled();
    });

    it('should not revoke certificate that is not issued', async () => {
      const dispute = makeDispute();
      const cert = makeCert({ status: 'revoked' });
      milestonesRepo.findById.mockResolvedValue(makeMilestone());
      repo.create.mockResolvedValue(dispute);
      certificatesRepo.findByMilestoneId.mockResolvedValue(cert);

      await service.file(input, ACTOR_DID);

      expect(certificatesRepo.update).not.toHaveBeenCalled();
    });

    // ── Milestone transition ─────────────────────────────────────────────

    it('should transition completed milestone to attestation_in_progress', async () => {
      const dispute = makeDispute();
      milestonesRepo.findById.mockResolvedValue(makeMilestone({ status: 'completed' }));
      repo.create.mockResolvedValue(dispute);
      certificatesRepo.findByMilestoneId.mockResolvedValue(null);

      await service.file(input, ACTOR_DID);

      expect(milestonesRepo.update).toHaveBeenCalledWith(MILESTONE_ID, {
        status: 'attestation_in_progress',
      });
    });

    it('should not transition milestone that is already attestation_in_progress', async () => {
      const dispute = makeDispute();
      milestonesRepo.findById.mockResolvedValue(makeMilestone({ status: 'attestation_in_progress' }));
      repo.create.mockResolvedValue(dispute);
      certificatesRepo.findByMilestoneId.mockResolvedValue(null);

      await service.file(input, ACTOR_DID);

      expect(milestonesRepo.update).not.toHaveBeenCalled();
    });

    // ── Webhook dispatch ─────────────────────────────────────────────────

    it('should dispatch dispute_opened webhook', async () => {
      const dispute = makeDispute();
      milestonesRepo.findById.mockResolvedValue(makeMilestone());
      repo.create.mockResolvedValue(dispute);
      certificatesRepo.findByMilestoneId.mockResolvedValue(null);

      await service.file(input, ACTOR_DID);

      expect(webhookDispatcher.dispatch).toHaveBeenCalledWith('dispute_opened', expect.objectContaining({
        disputeId: DISPUTE_ID,
        milestoneId: MILESTONE_ID,
      }));
    });

    // ── Audit log ────────────────────────────────────────────────────────

    it('should log audit entry on file', async () => {
      const dispute = makeDispute();
      milestonesRepo.findById.mockResolvedValue(makeMilestone());
      repo.create.mockResolvedValue(dispute);
      certificatesRepo.findByMilestoneId.mockResolvedValue(null);

      await service.file(input, ACTOR_DID);

      expect(auditLog.log).toHaveBeenCalledWith(expect.objectContaining({
        entityType: 'DisputeResolution',
        entityId: DISPUTE_ID,
        action: 'create',
        actorDid: ACTOR_DID,
      }));
    });
  });

  // ── Listing ─────────────────────────────────────────────────────────────

  describe('list()', () => {
    it('should list disputes by milestoneId', async () => {
      const disputes = [makeDispute(), makeDispute({ id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' })];
      repo.findByMilestoneId.mockResolvedValue(disputes);

      const result = await service.list(MILESTONE_ID);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
      }
    });
  });

  // ── Get by ID ───────────────────────────────────────────────────────────

  describe('getById()', () => {
    it('should return dispute when found', async () => {
      const dispute = makeDispute();
      repo.findById.mockResolvedValue(dispute);

      const result = await service.getById(DISPUTE_ID);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe(DISPUTE_ID);
      }
    });

    it('should return error when not found', async () => {
      repo.findById.mockResolvedValue(null);

      const result = await service.getById(DISPUTE_ID);

      expect(result.ok).toBe(false);
    });
  });

  // ── Review ──────────────────────────────────────────────────────────────

  describe('review()', () => {
    it('should move open dispute to under_review', async () => {
      const dispute = makeDispute({ status: 'open' });
      const updated = makeDispute({ status: 'under_review' });
      repo.findById.mockResolvedValue(dispute);
      repo.update.mockResolvedValue(updated);

      const result = await service.review(DISPUTE_ID, ACTOR_DID);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe('under_review');
      }
      expect(repo.update).toHaveBeenCalledWith(DISPUTE_ID, { status: 'under_review' });
    });

    it('should return error when dispute is already under_review', async () => {
      repo.findById.mockResolvedValue(makeDispute({ status: 'under_review' }));

      const result = await service.review(DISPUTE_ID, ACTOR_DID);

      expect(result.ok).toBe(false);
    });

    it('should return error when dispute not found', async () => {
      repo.findById.mockResolvedValue(null);

      const result = await service.review(DISPUTE_ID, ACTOR_DID);

      expect(result.ok).toBe(false);
    });

    it('should log audit entry on review', async () => {
      repo.findById.mockResolvedValue(makeDispute({ status: 'open' }));
      repo.update.mockResolvedValue(makeDispute({ status: 'under_review' }));

      await service.review(DISPUTE_ID, ACTOR_DID);

      expect(auditLog.log).toHaveBeenCalledWith(expect.objectContaining({
        entityType: 'DisputeResolution',
        action: 'update',
      }));
    });
  });

  // ── Resolve ─────────────────────────────────────────────────────────────

  describe('resolve()', () => {
    const resolveInput = { status: 'resolved' as const, resolutionNotes: 'Fixed', reassignedAuditorId: undefined };

    it('should resolve dispute under review', async () => {
      const dispute = makeDispute({ status: 'under_review' });
      const updated = makeDispute({ status: 'resolved', resolvedAt: new Date() });
      repo.findById.mockResolvedValue(dispute);
      repo.update.mockResolvedValue(updated);
      milestonesRepo.findById.mockResolvedValue(makeMilestone({ status: 'completed' }));

      const result = await service.resolve(DISPUTE_ID, resolveInput, ACTOR_DID);

      expect(result.ok).toBe(true);
    });

    it('should create auditor assignment when reassignedAuditorId provided', async () => {
      const dispute = makeDispute({ status: 'under_review' });
      const updated = makeDispute({ status: 'resolved', reassignedAuditorId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' });
      repo.findById.mockResolvedValue(dispute);
      repo.update.mockResolvedValue(updated);
      auditorAssignmentsRepo.getMaxRotationRound.mockResolvedValue(2);
      auditorAssignmentsRepo.create.mockResolvedValue({});
      milestonesRepo.findById.mockResolvedValue(makeMilestone({ status: 'completed' }));

      const input = { ...resolveInput, reassignedAuditorId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' };
      await service.resolve(DISPUTE_ID, input, ACTOR_DID);

      expect(auditorAssignmentsRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        milestoneId: MILESTONE_ID,
        auditorId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        rotationRound: 3,
      }));
    });

    it('should dismiss dispute without milestone transition', async () => {
      const dispute = makeDispute({ status: 'under_review' });
      const updated = makeDispute({ status: 'dismissed' });
      repo.findById.mockResolvedValue(dispute);
      repo.update.mockResolvedValue(updated);

      const input = { status: 'dismissed' as const, resolutionNotes: 'Not valid' };
      const result = await service.resolve(DISPUTE_ID, input, ACTOR_DID);

      expect(result.ok).toBe(true);
      // milestone transition only happens for 'resolved' status
      expect(milestonesRepo.findById).not.toHaveBeenCalled();
    });

    it('should return error when dispute is not under_review', async () => {
      repo.findById.mockResolvedValue(makeDispute({ status: 'open' }));

      const result = await service.resolve(DISPUTE_ID, resolveInput, ACTOR_DID);

      expect(result.ok).toBe(false);
    });

    it('should return error when dispute not found', async () => {
      repo.findById.mockResolvedValue(null);

      const result = await service.resolve(DISPUTE_ID, resolveInput, ACTOR_DID);

      expect(result.ok).toBe(false);
    });

    it('should transition milestone back to attestation_in_progress on resolve', async () => {
      const dispute = makeDispute({ status: 'under_review' });
      const updated = makeDispute({ status: 'resolved' });
      repo.findById.mockResolvedValue(dispute);
      repo.update.mockResolvedValue(updated);
      milestonesRepo.findById.mockResolvedValue(makeMilestone({ status: 'completed' }));

      await service.resolve(DISPUTE_ID, resolveInput, ACTOR_DID);

      expect(milestonesRepo.update).toHaveBeenCalledWith(MILESTONE_ID, {
        status: 'attestation_in_progress',
      });
    });

    it('should dispatch dispute_resolved webhook', async () => {
      const dispute = makeDispute({ status: 'under_review' });
      const updated = makeDispute({ status: 'resolved' });
      repo.findById.mockResolvedValue(dispute);
      repo.update.mockResolvedValue(updated);
      milestonesRepo.findById.mockResolvedValue(makeMilestone({ status: 'completed' }));

      await service.resolve(DISPUTE_ID, resolveInput, ACTOR_DID);

      expect(webhookDispatcher.dispatch).toHaveBeenCalledWith('dispute_resolved', expect.objectContaining({
        disputeId: DISPUTE_ID,
      }));
    });

    it('should log audit entry on resolve', async () => {
      const dispute = makeDispute({ status: 'under_review' });
      repo.findById.mockResolvedValue(dispute);
      repo.update.mockResolvedValue(makeDispute({ status: 'resolved' }));
      milestonesRepo.findById.mockResolvedValue(makeMilestone({ status: 'completed' }));

      await service.resolve(DISPUTE_ID, resolveInput, ACTOR_DID);

      expect(auditLog.log).toHaveBeenCalledWith(expect.objectContaining({
        entityType: 'DisputeResolution',
        action: 'update',
        actorDid: ACTOR_DID,
      }));
    });
  });
});

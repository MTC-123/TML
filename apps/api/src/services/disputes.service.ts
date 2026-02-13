import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import type { DisputeResolution, CreateDisputeInput, ResolveDisputeInput } from '@tml/types';
import { NotFoundError, ConflictError, ValidationError } from '@tml/types';
import type { DisputesRepository } from '../repositories/disputes.repository.js';
import type { MilestonesRepository } from '../repositories/milestones.repository.js';
import type { AuditorAssignmentsRepository } from '../repositories/auditor-assignments.repository.js';
import type { CertificatesRepository } from '../repositories/certificates.repository.js';
import type { WebhookDispatcherService } from './webhook-dispatcher.service.js';
import type { AuditLogService } from './audit-log.service.js';

export class DisputesService {
  constructor(
    private repo: DisputesRepository,
    private milestonesRepo: MilestonesRepository,
    private auditorAssignmentsRepo: AuditorAssignmentsRepository,
    private certificatesRepo: CertificatesRepository,
    private webhookDispatcher: WebhookDispatcherService,
    private auditLog: AuditLogService,
  ) {}

  async file(
    data: CreateDisputeInput,
    actorDid: string,
  ): Promise<Result<DisputeResolution>> {
    // Verify milestone exists and is in attestation_in_progress or completed
    const milestone = await this.milestonesRepo.findById(data.milestoneId);
    if (!milestone) {
      return err(new NotFoundError('Milestone', data.milestoneId));
    }

    if (
      milestone.status !== 'attestation_in_progress' &&
      milestone.status !== 'completed'
    ) {
      return err(
        new ValidationError(
          'Disputes can only be filed for milestones in attestation_in_progress or completed status',
          { currentStatus: milestone.status },
        ),
      );
    }

    // Create dispute with status 'open'
    const dispute = await this.repo.create(data);

    // Halt any issued certificate for this milestone
    const cert = await this.certificatesRepo.findByMilestoneId(data.milestoneId);
    if (cert && cert.status === 'issued') {
      await this.certificatesRepo.update(cert.id, {
        status: 'revoked',
        revocationReason: `Dispute filed: ${dispute.id}`,
        revokedAt: new Date(),
      });
    }

    // Transition milestone back to attestation_in_progress for re-inspection
    if (milestone.status === 'completed') {
      await this.milestonesRepo.update(data.milestoneId, {
        status: 'attestation_in_progress',
      });
    }

    // Dispatch dispute_opened webhook
    await this.webhookDispatcher.dispatch('dispute_opened', {
      disputeId: dispute.id,
      milestoneId: dispute.milestoneId,
      raisedById: dispute.raisedById,
      reason: dispute.reason,
    });

    await this.auditLog.log({
      entityType: 'DisputeResolution',
      entityId: dispute.id,
      action: 'create',
      actorDid,
      payload: data,
    });

    return ok(dispute);
  }

  async list(milestoneId: string): Promise<Result<DisputeResolution[]>> {
    const disputes = await this.repo.findByMilestoneId(milestoneId);
    return ok(disputes);
  }

  async getById(id: string): Promise<Result<DisputeResolution>> {
    const dispute = await this.repo.findById(id);
    if (!dispute) {
      return err(new NotFoundError('DisputeResolution', id));
    }
    return ok(dispute);
  }

  async review(id: string, actorDid: string): Promise<Result<DisputeResolution>> {
    const dispute = await this.repo.findById(id);
    if (!dispute) {
      return err(new NotFoundError('DisputeResolution', id));
    }

    if (dispute.status !== 'open') {
      return err(
        new ConflictError('Only open disputes can be moved to under_review', {
          currentStatus: dispute.status,
        }),
      );
    }

    const updated = await this.repo.update(id, { status: 'under_review' });

    await this.auditLog.log({
      entityType: 'DisputeResolution',
      entityId: id,
      action: 'update',
      actorDid,
      payload: { status: 'under_review' },
    });

    return ok(updated);
  }

  async resolve(
    id: string,
    data: ResolveDisputeInput,
    actorDid: string,
  ): Promise<Result<DisputeResolution>> {
    const dispute = await this.repo.findById(id);
    if (!dispute) {
      return err(new NotFoundError('DisputeResolution', id));
    }

    if (dispute.status !== 'under_review') {
      return err(
        new ConflictError('Only disputes under review can be resolved', {
          currentStatus: dispute.status,
        }),
      );
    }

    const updated = await this.repo.update(id, {
      status: data.status,
      resolutionNotes: data.resolutionNotes,
      resolvedAt: new Date(),
      reassignedAuditorId: data.reassignedAuditorId ?? null,
    });

    // If reassignedAuditorId: create new AuditorAssignment
    if (data.reassignedAuditorId) {
      const maxRound = await this.auditorAssignmentsRepo.getMaxRotationRound(
        dispute.milestoneId,
      );
      await this.auditorAssignmentsRepo.create({
        milestoneId: dispute.milestoneId,
        auditorId: data.reassignedAuditorId,
        rotationRound: maxRound + 1,
      });
    }

    // If resolved with re-inspection: transition milestone back to attestation_in_progress
    if (data.status === 'resolved') {
      const milestone = await this.milestonesRepo.findById(dispute.milestoneId);
      if (milestone && milestone.status === 'completed') {
        await this.milestonesRepo.update(dispute.milestoneId, {
          status: 'attestation_in_progress',
        });
      }
    }

    // Dispatch dispute_resolved webhook
    await this.webhookDispatcher.dispatch('dispute_resolved', {
      disputeId: updated.id,
      milestoneId: updated.milestoneId,
      status: updated.status,
      resolutionNotes: updated.resolutionNotes,
    });

    await this.auditLog.log({
      entityType: 'DisputeResolution',
      entityId: id,
      action: 'update',
      actorDid,
      payload: data,
    });

    return ok(updated);
  }
}

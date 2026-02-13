import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import type { Milestone, MilestoneStatus, AttestationType } from '@tml/types';
import { NotFoundError, ConflictError } from '@tml/types';
import type { MilestonesRepository } from '../repositories/milestones.repository.js';
import type { AttestationsRepository } from '../repositories/attestations.repository.js';
import type { AuditLogService } from './audit-log.service.js';

interface MilestoneWithCounts extends Milestone {
  attestationCounts: Record<AttestationType, { submitted: number; verified: number }>;
  hasCertificate: boolean;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['in_progress'],
  in_progress: ['attestation_in_progress'],
  attestation_in_progress: ['completed', 'failed'],
  failed: ['in_progress'],
};

export class MilestonesService {
  constructor(
    private repo: MilestonesRepository,
    private attestationsRepo: AttestationsRepository,
    private auditLog: AuditLogService,
  ) {}

  async list(
    projectId: string,
    pagination: { page: number; limit: number },
  ): Promise<Result<{ data: Milestone[]; pagination: { page: number; limit: number; total: number } }>> {
    const { data, total } = await this.repo.findByProjectId(projectId, pagination);
    return ok({ data, pagination: { page: pagination.page, limit: pagination.limit, total } });
  }

  async create(
    data: {
      projectId: string;
      sequenceNumber: number;
      description: string;
      deadline: Date;
      requiredInspectorCount: number;
      requiredAuditorCount: number;
      requiredCitizenCount: number;
    },
    actorDid: string,
  ): Promise<Result<Milestone>> {
    // Check duplicate sequence number within project
    const existing = await this.repo.findByProjectAndSequence(data.projectId, data.sequenceNumber);
    if (existing) {
      return err(new ConflictError(
        `Milestone with sequence number ${data.sequenceNumber} already exists for this project`,
        { projectId: data.projectId, sequenceNumber: data.sequenceNumber },
      ));
    }

    const milestone = await this.repo.create(data);

    await this.auditLog.log({
      entityType: 'Milestone',
      entityId: milestone.id,
      action: 'create',
      actorDid,
      payload: data,
    });

    return ok(milestone);
  }

  async getById(id: string): Promise<Result<MilestoneWithCounts>> {
    const milestone = await this.repo.findById(id);
    if (!milestone || milestone.deletedAt) {
      return err(new NotFoundError('Milestone', id));
    }

    const attestationCounts = await this.attestationsRepo.countByMilestoneAndType(id);

    return ok({
      ...milestone,
      attestationCounts,
      hasCertificate: milestone.status === 'completed',
    });
  }

  async update(
    id: string,
    data: {
      description?: string;
      deadline?: Date;
      requiredInspectorCount?: number;
      requiredAuditorCount?: number;
      requiredCitizenCount?: number;
    },
    actorDid: string,
  ): Promise<Result<Milestone>> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.deletedAt) {
      return err(new NotFoundError('Milestone', id));
    }

    const milestone = await this.repo.update(id, data);

    await this.auditLog.log({
      entityType: 'Milestone',
      entityId: id,
      action: 'update',
      actorDid,
      payload: data,
    });

    return ok(milestone);
  }

  async transition(
    id: string,
    targetStatus: MilestoneStatus,
    actorDid: string,
  ): Promise<Result<Milestone>> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.deletedAt) {
      return err(new NotFoundError('Milestone', id));
    }

    const allowedTargets = VALID_TRANSITIONS[existing.status];
    if (!allowedTargets || !allowedTargets.includes(targetStatus)) {
      return err(new ConflictError(
        `Cannot transition milestone from '${existing.status}' to '${targetStatus}'`,
        { currentStatus: existing.status, targetStatus },
      ));
    }

    const milestone = await this.repo.update(id, { status: targetStatus });

    await this.auditLog.log({
      entityType: 'Milestone',
      entityId: id,
      action: 'update',
      actorDid,
      payload: { from: existing.status, to: targetStatus },
    });

    return ok(milestone);
  }

  async remove(id: string, actorDid: string): Promise<Result<void>> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.deletedAt) {
      return err(new NotFoundError('Milestone', id));
    }

    await this.repo.softDelete(id);

    await this.auditLog.log({
      entityType: 'Milestone',
      entityId: id,
      action: 'delete',
      actorDid,
      payload: {},
    });

    return ok(undefined);
  }
}

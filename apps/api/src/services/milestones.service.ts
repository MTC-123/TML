import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import type { Milestone, MilestoneStatus, Attestation } from '@tml/types';
import { NotFoundError, ConflictError } from '@tml/types';
import type { MilestonesRepository } from '../repositories/milestones.repository.js';
import type { ProjectsRepository } from '../repositories/projects.repository.js';
import type { AuditLogService } from './audit-log.service.js';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['in_progress'],
  in_progress: ['attestation_in_progress'],
  attestation_in_progress: ['completed', 'failed'],
  failed: ['in_progress'],
};

export class MilestonesService {
  constructor(
    private repo: MilestonesRepository,
    private projectsRepo: ProjectsRepository,
    private auditLog: AuditLogService,
  ) {}

  /**
   * List milestones for a project with per-milestone attestation summary.
   */
  async list(
    projectId: string,
    pagination: { page: number; limit: number },
  ): Promise<Result<{
    data: Array<Milestone & {
      attestationSummary: Record<string, { submitted: number; verified: number }>;
      hasCertificate: boolean;
    }>;
    pagination: { page: number; limit: number; total: number };
  }>> {
    // Verify project exists
    const project = await this.projectsRepo.findById(projectId);
    if (!project || project.deletedAt) {
      return err(new NotFoundError('Project', projectId));
    }

    const { data, total } = await this.repo.findByProjectIdWithSummary(projectId, pagination);
    return ok({ data, pagination: { page: pagination.page, limit: pagination.limit, total } });
  }

  async create(
    projectId: string,
    data: {
      sequenceNumber: number;
      description: string;
      deadline: Date;
      requiredInspectorCount: number;
      requiredAuditorCount: number;
      requiredCitizenCount: number;
    },
    actorDid: string,
  ): Promise<Result<Milestone>> {
    // Verify project exists
    const project = await this.projectsRepo.findById(projectId);
    if (!project || project.deletedAt) {
      return err(new NotFoundError('Project', projectId));
    }

    // Check duplicate sequence number within project
    const existing = await this.repo.findByProjectAndSequence(projectId, data.sequenceNumber);
    if (existing) {
      return err(new ConflictError(
        `Milestone with sequence number ${data.sequenceNumber} already exists for this project`,
        { projectId, sequenceNumber: data.sequenceNumber },
      ));
    }

    const milestone = await this.repo.create({ ...data, projectId });

    await this.auditLog.log({
      entityType: 'Milestone',
      entityId: milestone.id,
      action: 'create',
      actorDid,
      payload: { ...data, projectId },
    });

    return ok(milestone);
  }

  /**
   * Milestone detail with all attestations.
   */
  async getById(id: string): Promise<Result<{
    milestone: Milestone;
    attestations: Attestation[];
  }>> {
    const result = await this.repo.findByIdWithAttestations(id);
    if (!result || result.milestone.deletedAt) {
      return err(new NotFoundError('Milestone', id));
    }
    return ok(result);
  }

  /**
   * Transition milestone status (enforces valid state machine).
   */
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
}

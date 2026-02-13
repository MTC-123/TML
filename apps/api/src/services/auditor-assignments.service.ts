import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import type { AuditorAssignment } from '@tml/types';
import { NotFoundError, ConflictError, ValidationError } from '@tml/types';
import type { AuditorAssignmentsRepository } from '../repositories/auditor-assignments.repository.js';
import type { ActorsRepository } from '../repositories/actors.repository.js';
import type { MilestonesRepository } from '../repositories/milestones.repository.js';
import type { TrustedIssuersRepository } from '../repositories/trusted-issuers.repository.js';
import type { AuditLogService } from './audit-log.service.js';

export class AuditorAssignmentsService {
  constructor(
    private repo: AuditorAssignmentsRepository,
    private actorsRepo: ActorsRepository,
    private milestonesRepo: MilestonesRepository,
    private auditLog: AuditLogService,
    private trustedIssuersRepo?: TrustedIssuersRepository,
  ) {}

  async select(
    milestoneId: string,
    count: number,
    actorDid: string,
  ): Promise<Result<AuditorAssignment[]>> {
    // 1. Validate milestone
    const milestone = await this.milestonesRepo.findById(milestoneId);
    if (!milestone) {
      return err(new NotFoundError('Milestone', milestoneId));
    }

    // 2. Get all actors with role independent_auditor
    const allAuditors = await this.actorsRepo.findByRole('independent_auditor');

    // 3. Exclude already-assigned auditors for this milestone
    const existingAssignments = await this.repo.findByMilestoneId(milestoneId);
    const assignedAuditorIds = new Set(existingAssignments.map((a) => a.auditorId));

    // 4. Rotation enforcement: exclude auditors who served this project in last 3 rounds
    const maxRound = await this.repo.getMaxRotationRound(milestoneId);
    const recentCutoff = Math.max(1, maxRound - 2);
    const recentAssignments = await this.repo.findRecentByProject(
      milestone.projectId,
      recentCutoff,
    );
    const recentAuditorIds = new Set(recentAssignments.map((a) => a.auditorId));

    // 5. Conflict of interest: exclude auditors from same organization as project contractors
    const conflictActorIds = await this.getConflictOfInterestActorIds(milestone.projectId);

    // 6. Filter available auditors
    const available = allAuditors.filter(
      (a) =>
        !assignedAuditorIds.has(a.id) &&
        !recentAuditorIds.has(a.id) &&
        !conflictActorIds.has(a.id),
    );

    if (available.length < count) {
      return err(
        new ConflictError('Not enough available auditors for selection', {
          available: available.length,
          requested: count,
          totalAuditors: allAuditors.length,
          excludedByAssignment: assignedAuditorIds.size,
          excludedByRotation: recentAuditorIds.size,
          excludedByConflict: conflictActorIds.size,
        }),
      );
    }

    // 7. Crypto-random selection from remaining pool
    const selected = cryptoRandomSelect(available, count);

    // 8. Increment rotation round
    const newRound = maxRound + 1;

    // 9. Create AuditorAssignment records
    const assignments: AuditorAssignment[] = [];
    for (const auditor of selected) {
      const assignment = await this.repo.create({
        milestoneId,
        auditorId: auditor.id,
        rotationRound: newRound,
      });
      assignments.push(assignment);
    }

    // 10. Audit log with selection rationale
    await this.auditLog.log({
      entityType: 'AuditorAssignment',
      entityId: milestoneId,
      action: 'assign',
      actorDid,
      payload: {
        milestoneId,
        count,
        auditorIds: selected.map((a) => a.id),
        selectionRationale: {
          totalEligible: allAuditors.length,
          excludedByAssignment: assignedAuditorIds.size,
          excludedByRotation: recentAuditorIds.size,
          excludedByConflict: conflictActorIds.size,
          poolSize: available.length,
          rotationRound: newRound,
        },
      },
    });

    return ok(assignments);
  }

  async list(milestoneId: string): Promise<Result<AuditorAssignment[]>> {
    const assignments = await this.repo.findByMilestoneId(milestoneId);
    return ok(assignments);
  }

  async getById(id: string): Promise<Result<AuditorAssignment>> {
    const assignment = await this.repo.findById(id);
    if (!assignment) {
      return err(new NotFoundError('AuditorAssignment', id));
    }
    return ok(assignment);
  }

  async update(
    id: string,
    data: { status?: string; conflictDeclared?: boolean; conflictReason?: string },
    actorDid: string,
  ): Promise<Result<AuditorAssignment>> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      return err(new NotFoundError('AuditorAssignment', id));
    }

    const updateData: { status?: string; conflictDeclared?: boolean; conflictReason?: string } = {};

    if (data.conflictDeclared === true) {
      updateData.status = 'recused';
      updateData.conflictDeclared = true;
      updateData.conflictReason = data.conflictReason;
    } else if (data.status === 'accepted') {
      updateData.status = 'accepted';
    } else if (data.status) {
      updateData.status = data.status;
    }

    const assignment = await this.repo.update(id, updateData as Parameters<typeof this.repo.update>[1]);

    await this.auditLog.log({
      entityType: 'AuditorAssignment',
      entityId: id,
      action: 'update',
      actorDid,
      payload: data,
    });

    return ok(assignment);
  }

  async reassign(id: string, actorDid: string): Promise<Result<AuditorAssignment>> {
    const original = await this.repo.findById(id);
    if (!original) {
      return err(new NotFoundError('AuditorAssignment', id));
    }

    if (original.status !== 'recused') {
      return err(
        new ConflictError('Only recused assignments can be reassigned', {
          currentStatus: original.status,
        }),
      );
    }

    // Run selection for 1 new auditor for the same milestone
    const selectResult = await this.select(original.milestoneId, 1, actorDid);
    if (!selectResult.ok) {
      return selectResult;
    }

    // Mark original as replaced
    await this.repo.update(id, { status: 'replaced' } as Parameters<typeof this.repo.update>[1]);

    const newAssignment = selectResult.value[0]!;

    await this.auditLog.log({
      entityType: 'AuditorAssignment',
      entityId: id,
      action: 'assign',
      actorDid,
      payload: { originalId: id, newAssignmentId: newAssignment.id },
    });

    return ok(newAssignment);
  }

  async revokeForFraud(
    auditorId: string,
    reason: string,
    actorDid: string,
  ): Promise<Result<void>> {
    if (!this.trustedIssuersRepo) {
      return err(new ValidationError('TrustedIssuerRegistry not configured'));
    }

    const auditor = await this.actorsRepo.findById(auditorId);
    if (!auditor) {
      return err(new NotFoundError('Actor', auditorId));
    }

    const issuer = await this.trustedIssuersRepo.findByDid(auditor.did);
    if (!issuer) {
      return err(new NotFoundError('TrustedIssuerRegistry entry for DID', auditor.did));
    }

    await this.trustedIssuersRepo.update(issuer.id, {
      active: false,
      revocationReason: reason,
      revokedAt: new Date(),
    });

    await this.auditLog.log({
      entityType: 'TrustedIssuerRegistry',
      entityId: issuer.id,
      action: 'revoke',
      actorDid,
      payload: {
        auditorId,
        auditorDid: auditor.did,
        reason,
        issuerId: issuer.id,
      },
    });

    return ok(undefined);
  }

  private async getConflictOfInterestActorIds(projectId: string): Promise<Set<string>> {
    // Find contractor actors who have inspector_verification attestations on this project
    const contractorActorIds = await this.repo.findContractorActorIdsForProject(projectId);
    if (contractorActorIds.length === 0) return new Set();

    // Find organizations those contractors belong to
    const contractorOrgIds = await this.actorsRepo.findOrganizationIdsForActors(contractorActorIds);
    if (contractorOrgIds.length === 0) return new Set();

    // Find all actors in those organizations (potential conflict of interest)
    const conflictActorIds = await this.actorsRepo.findActorIdsByOrganizationIds(contractorOrgIds);
    return new Set(conflictActorIds);
  }
}

export function cryptoRandomSelect<T>(items: T[], count: number): T[] {
  const pool = [...items];
  const selected: T[] = [];

  for (let i = 0; i < count; i++) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    const index = arr[0]! % pool.length;
    selected.push(pool[index]!);
    pool.splice(index, 1);
  }

  return selected;
}

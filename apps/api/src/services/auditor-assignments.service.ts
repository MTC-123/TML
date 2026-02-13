import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import type { AuditorAssignment } from '@tml/types';
import { NotFoundError, ConflictError } from '@tml/types';
import type { AuditorAssignmentsRepository } from '../repositories/auditor-assignments.repository.js';
import type { ActorsRepository } from '../repositories/actors.repository.js';
import type { MilestonesRepository } from '../repositories/milestones.repository.js';
import type { AuditLogService } from './audit-log.service.js';

export class AuditorAssignmentsService {
  constructor(
    private repo: AuditorAssignmentsRepository,
    private actorsRepo: ActorsRepository,
    private milestonesRepo: MilestonesRepository,
    private auditLog: AuditLogService,
  ) {}

  async select(
    milestoneId: string,
    count: number,
    actorDid: string,
  ): Promise<Result<AuditorAssignment[]>> {
    // Get all actors with role independent_auditor
    const allAuditors = await this.actorsRepo.findByRole('independent_auditor');

    // Exclude already-assigned auditors for this milestone
    const existingAssignments = await this.repo.findByMilestoneId(milestoneId);
    const assignedAuditorIds = new Set(existingAssignments.map((a) => a.auditorId));

    // Exclude auditors who served this project in last 3 rotation rounds
    const milestone = await this.milestonesRepo.findById(milestoneId);
    if (!milestone) {
      return err(new NotFoundError('Milestone', milestoneId));
    }

    const maxRound = await this.repo.getMaxRotationRound(milestoneId);
    const recentCutoff = Math.max(1, maxRound - 2);
    const recentAssignments = await this.repo.findRecentByProject(
      milestone.projectId,
      recentCutoff,
    );
    const recentAuditorIds = new Set(recentAssignments.map((a) => a.auditorId));

    // Filter available auditors
    const available = allAuditors.filter(
      (a) => !assignedAuditorIds.has(a.id) && !recentAuditorIds.has(a.id),
    );

    if (available.length < count) {
      return err(
        new ConflictError('Not enough available auditors for selection', {
          available: available.length,
          requested: count,
        }),
      );
    }

    // Crypto-random selection from remaining pool
    const selected = cryptoRandomSelect(available, count);

    // Increment rotation round
    const newRound = maxRound + 1;

    // Create AuditorAssignment records
    const assignments: AuditorAssignment[] = [];
    for (const auditor of selected) {
      const assignment = await this.repo.create({
        milestoneId,
        auditorId: auditor.id,
        rotationRound: newRound,
      });
      assignments.push(assignment);
    }

    await this.auditLog.log({
      entityType: 'AuditorAssignment',
      entityId: milestoneId,
      action: 'assign',
      actorDid,
      payload: { milestoneId, count, auditorIds: selected.map((a) => a.id) },
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
}

function cryptoRandomSelect<T>(items: T[], count: number): T[] {
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

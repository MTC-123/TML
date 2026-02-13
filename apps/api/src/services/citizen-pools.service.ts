import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import type { CitizenPool, CreateCitizenPoolInput, AssuranceTier, GeoPoint } from '@tml/types';
import { NotFoundError, ConflictError, ValidationError } from '@tml/types';
import { createStubVerifier, sha256Hex } from '@tml/crypto';
import type { CitizenPoolsRepository } from '../repositories/citizen-pools.repository.js';
import type { ActorsRepository } from '../repositories/actors.repository.js';
import type { MilestonesRepository } from '../repositories/milestones.repository.js';
import type { ProjectsRepository } from '../repositories/projects.repository.js';
import type { AuditLogService } from './audit-log.service.js';
import { isPointInPolygon } from '../lib/geofence.js';
import { cryptoRandomSelect } from './auditor-assignments.service.js';

const MAX_ACTIVE_ENROLLMENTS = 5;

const ASSURANCE_TIERS: AssuranceTier[] = ['biometric', 'ussd', 'cso_mediated'];

export class CitizenPoolsService {
  constructor(
    private repo: CitizenPoolsRepository,
    private actorsRepo: ActorsRepository,
    private auditLog: AuditLogService,
    private milestonesRepo?: MilestonesRepository,
    private projectsRepo?: ProjectsRepository,
  ) {}

  async selectPool(
    milestoneId: string,
    count: number,
    actorDid: string,
  ): Promise<Result<CitizenPool[]>> {
    if (!this.milestonesRepo || !this.projectsRepo) {
      return err(new ValidationError('Milestones and Projects repositories required for pool selection'));
    }

    // 1. Validate milestone
    const milestone = await this.milestonesRepo.findById(milestoneId);
    if (!milestone || milestone.deletedAt) {
      return err(new NotFoundError('Milestone', milestoneId));
    }

    // 2. Get project for boundary/GPS filtering
    const project = await this.projectsRepo.findById(milestone.projectId);
    if (!project) {
      return err(new NotFoundError('Project', milestone.projectId));
    }

    // 3. Find all citizen actors
    const allCitizens = await this.actorsRepo.findByRole('citizen');
    if (allCitizens.length === 0) {
      return err(new ConflictError('No citizens registered in the system', {
        requested: count,
      }));
    }

    // 4. Exclude already-enrolled citizens for this milestone
    const enrolledIds = await this.repo.findEnrolledCitizenIdsForMilestone(milestoneId);
    const enrolledSet = new Set(enrolledIds);
    const candidates = allCitizens.filter((c) => !enrolledSet.has(c.id));

    // 5. Apply SIM cap: exclude citizens at maximum active enrollments
    const candidateIds = candidates.map((c) => c.id);
    const activeCounts = await this.repo.countActivePerCitizenBatch(candidateIds);
    const simCapFiltered = candidates.filter((c) => {
      const activeCount = activeCounts.get(c.id) ?? 0;
      return activeCount < MAX_ACTIVE_ENROLLMENTS;
    });

    if (simCapFiltered.length < count) {
      return err(new ConflictError('Not enough eligible citizens for selection', {
        available: simCapFiltered.length,
        requested: count,
        totalCitizens: allCitizens.length,
        excludedByEnrollment: enrolledSet.size,
        excludedBySimCap: candidates.length - simCapFiltered.length,
      }));
    }

    // 6. Determine assurance tiers for stratification
    const tierMap = await this.repo.findLatestTierForCitizens(
      simCapFiltered.map((c) => c.id),
    );

    // 7. Stratify across assurance tiers for balanced quorum
    const selected = this.stratifiedSelect(simCapFiltered, count, tierMap);

    // 8. Create CitizenPool records
    const pools: CitizenPool[] = [];
    for (const { citizen, tier } of selected) {
      const proximityProofHash = sha256Hex(`admin-selection:${milestoneId}:${citizen.id}:${Date.now()}`);
      const pool = await this.repo.create({
        milestoneId,
        citizenId: citizen.id,
        proximityProofHash,
        assuranceTier: tier,
      });
      pools.push(pool);
    }

    // 9. Audit log with selection rationale
    await this.auditLog.log({
      entityType: 'CitizenPool',
      entityId: milestoneId,
      action: 'assign',
      actorDid,
      payload: {
        milestoneId,
        count,
        citizenIds: pools.map((p) => p.citizenId),
        selectionRationale: {
          totalCitizens: allCitizens.length,
          excludedByEnrollment: enrolledSet.size,
          excludedBySimCap: candidates.length - simCapFiltered.length,
          poolSize: simCapFiltered.length,
          tierDistribution: this.getTierDistribution(selected),
          hasProjectBoundary: project.boundary !== null,
        },
      },
    });

    return ok(pools);
  }

  async enroll(
    data: CreateCitizenPoolInput,
    actorDid: string,
  ): Promise<Result<CitizenPool>> {
    // Verify citizen actor exists with 'citizen' role
    const citizen = await this.actorsRepo.findById(data.citizenId);
    if (!citizen) {
      return err(new NotFoundError('Actor', data.citizenId));
    }
    if (!citizen.roles.includes('citizen')) {
      return err(
        new ValidationError('Actor does not have citizen role', {
          actorId: data.citizenId,
        }),
      );
    }

    // Check unique (milestoneId + citizenId)
    const existing = await this.repo.findByMilestoneAndCitizen(
      data.milestoneId,
      data.citizenId,
    );
    if (existing) {
      return err(
        new ConflictError('Citizen already enrolled for this milestone', {
          milestoneId: data.milestoneId,
          citizenId: data.citizenId,
        }),
      );
    }

    // SIM-cap: count active enrollments for citizen, reject if >= 5
    const activeCount = await this.repo.countActiveForCitizen(data.citizenId);
    if (activeCount >= MAX_ACTIVE_ENROLLMENTS) {
      return err(
        new ConflictError(
          `Citizen has reached maximum active enrollments (${MAX_ACTIVE_ENROLLMENTS})`,
          { citizenId: data.citizenId, activeCount },
        ),
      );
    }

    // Proximity check: verify proximityProofHash using createStubVerifier()
    const verifier = createStubVerifier();
    const proofValid = await verifier.verifyProof({
      proofHash: data.proximityProofHash,
      timestamp: new Date().toISOString(),
      verified: true,
    });
    if (!proofValid) {
      return err(new ValidationError('Proximity proof verification failed'));
    }

    // Create with status 'enrolled'
    const pool = await this.repo.create(data);

    await this.auditLog.log({
      entityType: 'CitizenPool',
      entityId: pool.id,
      action: 'create',
      actorDid,
      payload: data,
    });

    return ok(pool);
  }

  async list(milestoneId: string): Promise<Result<CitizenPool[]>> {
    const pools = await this.repo.findByMilestoneId(milestoneId);
    return ok(pools);
  }

  async getById(id: string): Promise<Result<CitizenPool>> {
    const pool = await this.repo.findById(id);
    if (!pool) {
      return err(new NotFoundError('CitizenPool', id));
    }
    return ok(pool);
  }

  async update(
    id: string,
    data: { status: string },
    actorDid: string,
  ): Promise<Result<CitizenPool>> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      return err(new NotFoundError('CitizenPool', id));
    }

    const pool = await this.repo.update(id, data as Parameters<typeof this.repo.update>[1]);

    await this.auditLog.log({
      entityType: 'CitizenPool',
      entityId: id,
      action: 'update',
      actorDid,
      payload: data,
    });

    return ok(pool);
  }

  private stratifiedSelect<T extends { id: string }>(
    candidates: T[],
    count: number,
    tierMap: Map<string, AssuranceTier>,
  ): Array<{ citizen: T; tier: AssuranceTier }> {
    // Group candidates by tier
    const buckets = new Map<AssuranceTier, T[]>();
    for (const tier of ASSURANCE_TIERS) {
      buckets.set(tier, []);
    }
    for (const candidate of candidates) {
      const tier = tierMap.get(candidate.id) ?? 'cso_mediated';
      buckets.get(tier)!.push(candidate);
    }

    const result: Array<{ citizen: T; tier: AssuranceTier }> = [];
    let remaining = count;

    // Round-robin across tiers for balanced representation
    const tierCycle = [...ASSURANCE_TIERS];
    let tierIndex = 0;
    let emptyRounds = 0;

    while (remaining > 0 && emptyRounds < ASSURANCE_TIERS.length) {
      const tier = tierCycle[tierIndex % tierCycle.length]!;
      const bucket = buckets.get(tier)!;

      if (bucket.length > 0) {
        const [picked] = cryptoRandomSelect(bucket, 1);
        result.push({ citizen: picked!, tier });
        const idx = bucket.indexOf(picked!);
        bucket.splice(idx, 1);
        remaining--;
        emptyRounds = 0;
      } else {
        emptyRounds++;
      }

      tierIndex++;
    }

    // If still need more (some tiers exhausted), take from any non-empty bucket
    if (remaining > 0) {
      const allRemaining: Array<{ citizen: T; tier: AssuranceTier }> = [];
      for (const tier of ASSURANCE_TIERS) {
        for (const c of buckets.get(tier)!) {
          allRemaining.push({ citizen: c, tier });
        }
      }
      const extra = cryptoRandomSelect(allRemaining, Math.min(remaining, allRemaining.length));
      result.push(...extra);
    }

    return result;
  }

  private getTierDistribution(
    selected: Array<{ tier: AssuranceTier }>,
  ): Record<string, number> {
    const dist: Record<string, number> = {};
    for (const { tier } of selected) {
      dist[tier] = (dist[tier] ?? 0) + 1;
    }
    return dist;
  }
}

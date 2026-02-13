import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import type { CitizenPool, CreateCitizenPoolInput } from '@tml/types';
import { NotFoundError, ConflictError, ValidationError } from '@tml/types';
import { createStubVerifier } from '@tml/crypto';
import type { CitizenPoolsRepository } from '../repositories/citizen-pools.repository.js';
import type { ActorsRepository } from '../repositories/actors.repository.js';
import type { AuditLogService } from './audit-log.service.js';

const MAX_ACTIVE_ENROLLMENTS = 5;

export class CitizenPoolsService {
  constructor(
    private repo: CitizenPoolsRepository,
    private actorsRepo: ActorsRepository,
    private auditLog: AuditLogService,
  ) {}

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
}

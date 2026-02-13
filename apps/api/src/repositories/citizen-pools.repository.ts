import type { PrismaClient, Prisma } from '@prisma/client';
import type {
  CitizenPool,
  CitizenPoolStatus,
  AssuranceTier,
  CreateCitizenPoolInput,
  UpdateCitizenPoolInput,
} from '@tml/types';

export class CitizenPoolsRepository {
  constructor(private prisma: PrismaClient) {}

  async findByMilestoneId(milestoneId: string): Promise<CitizenPool[]> {
    const pools = await this.prisma.citizenPool.findMany({
      where: { milestoneId },
      orderBy: { enrolledAt: 'desc' },
    });
    return pools.map((p) => this.toEntity(p));
  }

  async findById(id: string): Promise<CitizenPool | null> {
    const pool = await this.prisma.citizenPool.findUnique({ where: { id } });
    return pool ? this.toEntity(pool) : null;
  }

  async create(data: CreateCitizenPoolInput): Promise<CitizenPool> {
    const pool = await this.prisma.citizenPool.create({
      data: {
        milestoneId: data.milestoneId,
        citizenId: data.citizenId,
        proximityProofHash: data.proximityProofHash,
        assuranceTier: data.assuranceTier,
      },
    });
    return this.toEntity(pool);
  }

  async update(id: string, data: UpdateCitizenPoolInput): Promise<CitizenPool> {
    const pool = await this.prisma.citizenPool.update({
      where: { id },
      data: { status: data.status },
    });
    return this.toEntity(pool);
  }

  async findByMilestoneAndCitizen(
    milestoneId: string,
    citizenId: string,
  ): Promise<CitizenPool | null> {
    const pool = await this.prisma.citizenPool.findUnique({
      where: { milestoneId_citizenId: { milestoneId, citizenId } },
    });
    return pool ? this.toEntity(pool) : null;
  }

  async findByMilestoneAndCitizenIds(
    milestoneId: string,
    citizenIds: string[],
  ): Promise<CitizenPool[]> {
    const pools = await this.prisma.citizenPool.findMany({
      where: {
        milestoneId,
        citizenId: { in: citizenIds },
      },
    });
    return pools.map((p) => this.toEntity(p));
  }

  async countActiveForCitizen(citizenId: string): Promise<number> {
    return this.prisma.citizenPool.count({
      where: {
        citizenId,
        status: { in: ['enrolled', 'attested'] },
      },
    });
  }

  async countActivePerCitizenBatch(citizenIds: string[]): Promise<Map<string, number>> {
    if (citizenIds.length === 0) return new Map();
    const results = await this.prisma.citizenPool.groupBy({
      by: ['citizenId'],
      _count: { id: true },
      where: {
        citizenId: { in: citizenIds },
        status: { in: ['enrolled', 'attested'] },
      },
    });
    const map = new Map<string, number>();
    for (const r of results) {
      map.set(r.citizenId, r._count.id);
    }
    return map;
  }

  async findLatestTierForCitizens(citizenIds: string[]): Promise<Map<string, AssuranceTier>> {
    if (citizenIds.length === 0) return new Map();
    const pools = await this.prisma.citizenPool.findMany({
      where: { citizenId: { in: citizenIds } },
      orderBy: { enrolledAt: 'desc' },
      select: { citizenId: true, assuranceTier: true },
    });
    const map = new Map<string, AssuranceTier>();
    for (const p of pools) {
      if (!map.has(p.citizenId)) {
        map.set(p.citizenId, p.assuranceTier as AssuranceTier);
      }
    }
    return map;
  }

  async findEnrolledCitizenIdsForMilestone(milestoneId: string): Promise<string[]> {
    const pools = await this.prisma.citizenPool.findMany({
      where: { milestoneId },
      select: { citizenId: true },
    });
    return pools.map((p) => p.citizenId);
  }

  private toEntity(raw: {
    id: string;
    milestoneId: string;
    citizenId: string;
    proximityProofHash: string;
    assuranceTier: string;
    status: string;
    enrolledAt: Date;
    updatedAt: Date;
  }): CitizenPool {
    return {
      id: raw.id,
      milestoneId: raw.milestoneId,
      citizenId: raw.citizenId,
      proximityProofHash: raw.proximityProofHash,
      assuranceTier: raw.assuranceTier as AssuranceTier,
      status: raw.status as CitizenPoolStatus,
      enrolledAt: raw.enrolledAt,
      updatedAt: raw.updatedAt,
    };
  }
}

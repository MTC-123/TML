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

  async countActiveForCitizen(citizenId: string): Promise<number> {
    return this.prisma.citizenPool.count({
      where: {
        citizenId,
        status: { in: ['enrolled', 'attested'] },
      },
    });
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

import type { PrismaClient, Prisma } from '@prisma/client';
import type { DisputeResolution, DisputeStatus, CreateDisputeInput } from '@tml/types';

export class DisputesRepository {
  constructor(private prisma: PrismaClient) {}

  async findByMilestoneId(milestoneId: string): Promise<DisputeResolution[]> {
    const disputes = await this.prisma.disputeResolution.findMany({
      where: { milestoneId },
      orderBy: { raisedAt: 'desc' },
    });
    return disputes.map((d) => this.toEntity(d));
  }

  async findById(id: string): Promise<DisputeResolution | null> {
    const dispute = await this.prisma.disputeResolution.findUnique({ where: { id } });
    return dispute ? this.toEntity(dispute) : null;
  }

  async create(data: CreateDisputeInput): Promise<DisputeResolution> {
    const dispute = await this.prisma.disputeResolution.create({
      data: {
        milestoneId: data.milestoneId,
        raisedById: data.raisedById,
        reason: data.reason,
      },
    });
    return this.toEntity(dispute);
  }

  async update(id: string, data: Partial<DisputeResolution>): Promise<DisputeResolution> {
    const updateData: Prisma.DisputeResolutionUpdateInput = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.resolutionNotes !== undefined) updateData.resolutionNotes = data.resolutionNotes;
    if (data.reassignedAuditorId !== undefined) updateData.reassignedAuditorId = data.reassignedAuditorId;
    if (data.resolvedAt !== undefined) updateData.resolvedAt = data.resolvedAt;

    const dispute = await this.prisma.disputeResolution.update({
      where: { id },
      data: updateData,
    });
    return this.toEntity(dispute);
  }

  private toEntity(raw: {
    id: string;
    milestoneId: string;
    raisedById: string;
    reassignedAuditorId: string | null;
    reason: string;
    status: string;
    resolutionNotes: string | null;
    raisedAt: Date;
    resolvedAt: Date | null;
    updatedAt: Date;
  }): DisputeResolution {
    return {
      id: raw.id,
      milestoneId: raw.milestoneId,
      raisedById: raw.raisedById,
      reassignedAuditorId: raw.reassignedAuditorId,
      reason: raw.reason,
      status: raw.status as DisputeStatus,
      resolutionNotes: raw.resolutionNotes,
      raisedAt: raw.raisedAt,
      resolvedAt: raw.resolvedAt,
      updatedAt: raw.updatedAt,
    };
  }
}

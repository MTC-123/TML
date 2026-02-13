import type { PrismaClient, Prisma } from '@prisma/client';
import type { Milestone, MilestoneStatus, CreateMilestoneInput } from '@tml/types';

export class MilestonesRepository {
  constructor(private prisma: PrismaClient) {}

  async findByProjectId(
    projectId: string,
    params: { page: number; limit: number },
  ): Promise<{ data: Milestone[]; total: number }> {
    const where: Prisma.MilestoneWhereInput = { projectId, deletedAt: null };

    const [data, total] = await Promise.all([
      this.prisma.milestone.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { sequenceNumber: 'asc' },
      }),
      this.prisma.milestone.count({ where }),
    ]);

    return { data: data.map((m) => this.toEntity(m)), total };
  }

  async findById(id: string): Promise<Milestone | null> {
    const milestone = await this.prisma.milestone.findUnique({ where: { id } });
    return milestone ? this.toEntity(milestone) : null;
  }

  async create(data: CreateMilestoneInput): Promise<Milestone> {
    const milestone = await this.prisma.milestone.create({
      data: {
        projectId: data.projectId,
        sequenceNumber: data.sequenceNumber,
        description: data.description,
        deadline: data.deadline,
        requiredInspectorCount: data.requiredInspectorCount,
        requiredAuditorCount: data.requiredAuditorCount,
        requiredCitizenCount: data.requiredCitizenCount,
      },
    });
    return this.toEntity(milestone);
  }

  async update(id: string, data: Partial<Milestone>): Promise<Milestone> {
    const updateData: Prisma.MilestoneUpdateInput = {};
    if (data.description !== undefined) updateData.description = data.description;
    if (data.deadline !== undefined) updateData.deadline = data.deadline;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.requiredInspectorCount !== undefined) updateData.requiredInspectorCount = data.requiredInspectorCount;
    if (data.requiredAuditorCount !== undefined) updateData.requiredAuditorCount = data.requiredAuditorCount;
    if (data.requiredCitizenCount !== undefined) updateData.requiredCitizenCount = data.requiredCitizenCount;

    const milestone = await this.prisma.milestone.update({
      where: { id },
      data: updateData,
    });
    return this.toEntity(milestone);
  }

  async softDelete(id: string): Promise<Milestone> {
    const milestone = await this.prisma.milestone.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return this.toEntity(milestone);
  }

  async findByProjectAndSequence(projectId: string, sequenceNumber: number): Promise<Milestone | null> {
    const milestone = await this.prisma.milestone.findUnique({
      where: { projectId_sequenceNumber: { projectId, sequenceNumber } },
    });
    return milestone ? this.toEntity(milestone) : null;
  }

  private toEntity(raw: {
    id: string;
    projectId: string;
    sequenceNumber: number;
    description: string;
    deadline: Date;
    status: string;
    requiredInspectorCount: number;
    requiredAuditorCount: number;
    requiredCitizenCount: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Milestone {
    return {
      id: raw.id,
      projectId: raw.projectId,
      sequenceNumber: raw.sequenceNumber,
      description: raw.description,
      deadline: raw.deadline,
      status: raw.status as MilestoneStatus,
      requiredInspectorCount: raw.requiredInspectorCount,
      requiredAuditorCount: raw.requiredAuditorCount,
      requiredCitizenCount: raw.requiredCitizenCount,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    };
  }
}

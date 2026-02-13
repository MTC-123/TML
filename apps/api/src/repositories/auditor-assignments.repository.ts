import type { PrismaClient, Prisma } from '@prisma/client';
import type {
  AuditorAssignment,
  AuditorAssignmentStatus,
  CreateAuditorAssignmentInput,
  UpdateAuditorAssignmentInput,
} from '@tml/types';

export class AuditorAssignmentsRepository {
  constructor(private prisma: PrismaClient) {}

  async findByMilestoneId(milestoneId: string): Promise<AuditorAssignment[]> {
    const assignments = await this.prisma.auditorAssignment.findMany({
      where: { milestoneId },
      orderBy: { assignedAt: 'desc' },
    });
    return assignments.map((a) => this.toEntity(a));
  }

  async findById(id: string): Promise<AuditorAssignment | null> {
    const assignment = await this.prisma.auditorAssignment.findUnique({ where: { id } });
    return assignment ? this.toEntity(assignment) : null;
  }

  async create(data: CreateAuditorAssignmentInput): Promise<AuditorAssignment> {
    const assignment = await this.prisma.auditorAssignment.create({
      data: {
        milestoneId: data.milestoneId,
        auditorId: data.auditorId,
        rotationRound: data.rotationRound,
      },
    });
    return this.toEntity(assignment);
  }

  async update(id: string, data: UpdateAuditorAssignmentInput): Promise<AuditorAssignment> {
    const updateData: Prisma.AuditorAssignmentUpdateInput = {
      status: data.status,
    };
    if (data.conflictDeclared !== undefined) {
      updateData.conflictDeclared = data.conflictDeclared;
    }
    if (data.conflictReason !== undefined) {
      updateData.conflictReason = data.conflictReason;
    }

    const assignment = await this.prisma.auditorAssignment.update({
      where: { id },
      data: updateData,
    });
    return this.toEntity(assignment);
  }

  async findByMilestoneAndAuditor(
    milestoneId: string,
    auditorId: string,
  ): Promise<AuditorAssignment | null> {
    const assignment = await this.prisma.auditorAssignment.findUnique({
      where: { milestoneId_auditorId: { milestoneId, auditorId } },
    });
    return assignment ? this.toEntity(assignment) : null;
  }

  async getMaxRotationRound(milestoneId: string): Promise<number> {
    const result = await this.prisma.auditorAssignment.aggregate({
      _max: { rotationRound: true },
      where: { milestoneId },
    });
    return result._max.rotationRound ?? 0;
  }

  async findRecentByProject(projectId: string, rounds: number): Promise<AuditorAssignment[]> {
    const assignments = await this.prisma.auditorAssignment.findMany({
      where: {
        milestone: { projectId },
        rotationRound: { gte: Math.max(1, rounds) },
      },
      orderBy: { assignedAt: 'desc' },
    });
    return assignments.map((a) => this.toEntity(a));
  }

  private toEntity(raw: {
    id: string;
    milestoneId: string;
    auditorId: string;
    rotationRound: number;
    conflictDeclared: boolean;
    conflictReason: string | null;
    status: string;
    assignedAt: Date;
    updatedAt: Date;
  }): AuditorAssignment {
    return {
      id: raw.id,
      milestoneId: raw.milestoneId,
      auditorId: raw.auditorId,
      rotationRound: raw.rotationRound,
      conflictDeclared: raw.conflictDeclared,
      conflictReason: raw.conflictReason,
      status: raw.status as AuditorAssignmentStatus,
      assignedAt: raw.assignedAt,
      updatedAt: raw.updatedAt,
    };
  }
}

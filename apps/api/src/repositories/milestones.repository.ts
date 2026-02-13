import type { PrismaClient, Prisma } from '@prisma/client';
import type { Milestone, MilestoneStatus, CreateMilestoneInput, Attestation, AttestationType, AttestationStatus } from '@tml/types';

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

  /**
   * List milestones with per-milestone attestation summary counts.
   */
  async findByProjectIdWithSummary(
    projectId: string,
    params: { page: number; limit: number },
  ): Promise<{
    data: Array<Milestone & {
      attestationSummary: Record<string, { submitted: number; verified: number }>;
      hasCertificate: boolean;
    }>;
    total: number;
  }> {
    const where: Prisma.MilestoneWhereInput = { projectId, deletedAt: null };

    const [rawData, total] = await Promise.all([
      this.prisma.milestone.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { sequenceNumber: 'asc' },
        include: {
          attestations: { select: { type: true, status: true } },
          complianceCertificate: { select: { id: true } },
        },
      }),
      this.prisma.milestone.count({ where }),
    ]);

    const data = rawData.map((m) => {
      const summary: Record<string, { submitted: number; verified: number }> = {
        inspector_verification: { submitted: 0, verified: 0 },
        auditor_review: { submitted: 0, verified: 0 },
        citizen_approval: { submitted: 0, verified: 0 },
      };
      for (const a of m.attestations) {
        const bucket = summary[a.type];
        if (!bucket) continue;
        if (a.status === 'submitted') bucket.submitted++;
        else if (a.status === 'verified') bucket.verified++;
      }

      return {
        ...this.toEntity(m),
        attestationSummary: summary,
        hasCertificate: m.complianceCertificate !== null,
      };
    });

    return { data, total };
  }

  async findById(id: string): Promise<Milestone | null> {
    const milestone = await this.prisma.milestone.findUnique({ where: { id } });
    return milestone ? this.toEntity(milestone) : null;
  }

  /**
   * Fetch milestone with all attestations for the detail endpoint.
   */
  async findByIdWithAttestations(id: string): Promise<{
    milestone: Milestone;
    attestations: Attestation[];
  } | null> {
    const raw = await this.prisma.milestone.findUnique({
      where: { id },
      include: {
        attestations: { orderBy: { submittedAt: 'desc' } },
        complianceCertificate: { select: { id: true } },
      },
    });

    if (!raw) return null;

    const attestations: Attestation[] = raw.attestations.map((a) => ({
      id: a.id,
      milestoneId: a.milestoneId,
      actorId: a.actorId,
      type: a.type as AttestationType,
      evidenceHash: a.evidenceHash,
      gpsLatitude: a.gpsLatitude.toString(),
      gpsLongitude: a.gpsLongitude.toString(),
      deviceAttestationToken: a.deviceAttestationToken,
      digitalSignature: a.digitalSignature,
      status: a.status as AttestationStatus,
      submittedAt: a.submittedAt,
      revokedAt: a.revokedAt,
    }));

    return {
      milestone: this.toEntity(raw),
      attestations,
    };
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

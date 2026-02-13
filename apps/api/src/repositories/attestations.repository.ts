import type { PrismaClient, Prisma } from '@prisma/client';
import type {
  Attestation,
  AttestationType,
  AttestationStatus,
  CreateAttestationInput,
} from '@tml/types';

export class AttestationsRepository {
  constructor(private prisma: PrismaClient) {}

  async findByMilestoneId(
    milestoneId: string,
    params: { page: number; limit: number },
  ): Promise<{ data: Attestation[]; total: number }> {
    const where: Prisma.AttestationWhereInput = { milestoneId };

    const [data, total] = await Promise.all([
      this.prisma.attestation.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.attestation.count({ where }),
    ]);

    return { data: data.map((a) => this.toEntity(a)), total };
  }

  async findById(id: string): Promise<Attestation | null> {
    const attestation = await this.prisma.attestation.findUnique({ where: { id } });
    return attestation ? this.toEntity(attestation) : null;
  }

  async create(data: CreateAttestationInput): Promise<Attestation> {
    const attestation = await this.prisma.attestation.create({
      data: {
        milestoneId: data.milestoneId,
        actorId: data.actorId,
        type: data.type,
        evidenceHash: data.evidenceHash,
        gpsLatitude: data.gpsLatitude,
        gpsLongitude: data.gpsLongitude,
        deviceAttestationToken: data.deviceAttestationToken,
        digitalSignature: data.digitalSignature,
      },
    });
    return this.toEntity(attestation);
  }

  async updateStatus(id: string, status: AttestationStatus, revokedAt?: Date): Promise<Attestation> {
    const data: Prisma.AttestationUpdateInput = { status };
    if (revokedAt !== undefined) {
      data.revokedAt = revokedAt;
    }
    const attestation = await this.prisma.attestation.update({
      where: { id },
      data,
    });
    return this.toEntity(attestation);
  }

  async countByMilestoneAndType(
    milestoneId: string,
  ): Promise<Record<AttestationType, { submitted: number; verified: number }>> {
    const counts = await this.prisma.attestation.groupBy({
      by: ['type', 'status'],
      _count: { id: true },
      where: { milestoneId },
    });

    const result = {
      inspector_verification: { submitted: 0, verified: 0 },
      auditor_review: { submitted: 0, verified: 0 },
      citizen_approval: { submitted: 0, verified: 0 },
    } as Record<AttestationType, { submitted: number; verified: number }>;

    for (const row of counts) {
      const type = row.type as AttestationType;
      if (row.status === 'submitted') {
        result[type].submitted += row._count.id;
      } else if (row.status === 'verified') {
        result[type].verified += row._count.id;
      }
    }

    return result;
  }

  async findByMilestoneActorType(
    milestoneId: string,
    actorId: string,
    type: AttestationType,
  ): Promise<Attestation | null> {
    const attestation = await this.prisma.attestation.findUnique({
      where: { milestoneId_actorId_type: { milestoneId, actorId, type } },
    });
    return attestation ? this.toEntity(attestation) : null;
  }

  async findByMilestoneDeviceAndType(
    milestoneId: string,
    deviceAttestationToken: string,
    type: AttestationType,
  ): Promise<Attestation | null> {
    const attestation = await this.prisma.attestation.findFirst({
      where: {
        milestoneId,
        deviceAttestationToken,
        type,
        status: { in: ['submitted', 'verified'] },
      },
    });
    return attestation ? this.toEntity(attestation) : null;
  }

  async findActiveByMilestoneAndType(
    milestoneId: string,
    type: AttestationType,
  ): Promise<Attestation[]> {
    const attestations = await this.prisma.attestation.findMany({
      where: {
        milestoneId,
        type,
        status: { in: ['submitted', 'verified'] },
      },
    });
    return attestations.map((a) => this.toEntity(a));
  }

  private toEntity(raw: {
    id: string;
    milestoneId: string;
    actorId: string;
    type: string;
    evidenceHash: string;
    gpsLatitude: Prisma.Decimal;
    gpsLongitude: Prisma.Decimal;
    deviceAttestationToken: string;
    digitalSignature: string;
    status: string;
    submittedAt: Date;
    revokedAt: Date | null;
  }): Attestation {
    return {
      id: raw.id,
      milestoneId: raw.milestoneId,
      actorId: raw.actorId,
      type: raw.type as AttestationType,
      evidenceHash: raw.evidenceHash,
      gpsLatitude: raw.gpsLatitude.toString(),
      gpsLongitude: raw.gpsLongitude.toString(),
      deviceAttestationToken: raw.deviceAttestationToken,
      digitalSignature: raw.digitalSignature,
      status: raw.status as AttestationStatus,
      submittedAt: raw.submittedAt,
      revokedAt: raw.revokedAt,
    };
  }
}

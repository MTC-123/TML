import type { PrismaClient, Prisma } from '@prisma/client';
import type { ConsentRecord, ConsentPurpose, ConsentStatus } from '@tml/types';

export class ConsentRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    actorId: string;
    actorDid: string;
    purpose: string;
    scope: string;
    legalBasis: string;
    status: string;
    expiresAt: Date | null;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<ConsentRecord> {
    const record = await this.prisma.consentRecord.create({
      data: {
        actorId: data.actorId,
        actorDid: data.actorDid,
        purpose: data.purpose as ConsentPurpose,
        scope: data.scope,
        legalBasis: data.legalBasis,
        status: data.status as ConsentStatus,
        expiresAt: data.expiresAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
    return this.toEntity(record);
  }

  async findById(id: string): Promise<ConsentRecord | null> {
    const record = await this.prisma.consentRecord.findUnique({ where: { id } });
    return record ? this.toEntity(record) : null;
  }

  async findByActorId(actorId: string): Promise<ConsentRecord[]> {
    const records = await this.prisma.consentRecord.findMany({
      where: { actorId },
      orderBy: { grantedAt: 'desc' },
    });
    return records.map((r) => this.toEntity(r));
  }

  async findByActorAndPurpose(
    actorId: string,
    purpose: string,
  ): Promise<ConsentRecord | null> {
    const record = await this.prisma.consentRecord.findUnique({
      where: {
        actorId_purpose: {
          actorId,
          purpose: purpose as ConsentPurpose,
        },
      },
    });
    return record ? this.toEntity(record) : null;
  }

  async update(
    id: string,
    data: Partial<Pick<ConsentRecord, 'status' | 'revokedAt' | 'expiresAt'>>,
  ): Promise<ConsentRecord> {
    const updateData: Prisma.ConsentRecordUpdateInput = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.revokedAt !== undefined) updateData.revokedAt = data.revokedAt;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;

    const record = await this.prisma.consentRecord.update({
      where: { id },
      data: updateData,
    });
    return this.toEntity(record);
  }

  private toEntity(raw: {
    id: string;
    actorId: string;
    actorDid: string;
    purpose: string;
    scope: string;
    legalBasis: string;
    status: string;
    grantedAt: Date;
    expiresAt: Date | null;
    revokedAt: Date | null;
    ipAddress: string | null;
    userAgent: string | null;
  }): ConsentRecord {
    return {
      id: raw.id,
      actorId: raw.actorId,
      actorDid: raw.actorDid,
      purpose: raw.purpose as ConsentPurpose,
      scope: raw.scope,
      legalBasis: raw.legalBasis,
      status: raw.status as ConsentStatus,
      grantedAt: raw.grantedAt,
      expiresAt: raw.expiresAt,
      revokedAt: raw.revokedAt,
      ipAddress: raw.ipAddress,
      userAgent: raw.userAgent,
    };
  }
}

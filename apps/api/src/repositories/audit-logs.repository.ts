import type { PrismaClient, Prisma } from '@prisma/client';
import type { AuditLog, AuditAction } from '@tml/types';

export class AuditLogsRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    entityType: string;
    entityId: string;
    action: AuditAction;
    actorDid: string;
    payloadHash: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditLog> {
    const log = await this.prisma.auditLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        actorDid: data.actorDid,
        payloadHash: data.payloadHash,
        metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
      },
    });
    return this.toEntity(log);
  }

  async query(params: {
    entityType?: string;
    entityId?: string;
    actorDid?: string;
    action?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }): Promise<{ data: AuditLog[]; total: number }> {
    const where: Prisma.AuditLogWhereInput = {};
    if (params.entityType) where.entityType = params.entityType;
    if (params.entityId) where.entityId = params.entityId;
    if (params.actorDid) where.actorDid = params.actorDid;
    if (params.action) where.action = params.action as AuditAction;
    if (params.from || params.to) {
      where.timestamp = {};
      if (params.from) where.timestamp.gte = params.from;
      if (params.to) where.timestamp.lte = params.to;
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: data.map((l) => this.toEntity(l)), total };
  }

  private toEntity(raw: {
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    actorDid: string;
    payloadHash: string;
    metadata: Prisma.JsonValue;
    timestamp: Date;
  }): AuditLog {
    return {
      id: raw.id,
      entityType: raw.entityType,
      entityId: raw.entityId,
      action: raw.action as AuditAction,
      actorDid: raw.actorDid,
      payloadHash: raw.payloadHash,
      metadata: raw.metadata as Record<string, unknown> | null,
      timestamp: raw.timestamp,
    };
  }
}

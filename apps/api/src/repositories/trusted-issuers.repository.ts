import type { PrismaClient, Prisma } from '@prisma/client';
import type { TrustedIssuerRegistry, CreateTrustedIssuerInput } from '@tml/types';

export class TrustedIssuersRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<TrustedIssuerRegistry[]> {
    const issuers = await this.prisma.trustedIssuerRegistry.findMany({
      orderBy: { activatedAt: 'desc' },
    });
    return issuers.map((i) => this.toEntity(i));
  }

  async findById(id: string): Promise<TrustedIssuerRegistry | null> {
    const issuer = await this.prisma.trustedIssuerRegistry.findUnique({ where: { id } });
    return issuer ? this.toEntity(issuer) : null;
  }

  async findByDid(issuerDid: string): Promise<TrustedIssuerRegistry | null> {
    const issuer = await this.prisma.trustedIssuerRegistry.findUnique({
      where: { issuerDid },
    });
    return issuer ? this.toEntity(issuer) : null;
  }

  async create(data: CreateTrustedIssuerInput): Promise<TrustedIssuerRegistry> {
    const issuer = await this.prisma.trustedIssuerRegistry.create({
      data: {
        issuerDid: data.issuerDid,
        issuerName: data.issuerName,
        credentialTypes: data.credentialTypes,
      },
    });
    return this.toEntity(issuer);
  }

  async update(id: string, data: Partial<TrustedIssuerRegistry>): Promise<TrustedIssuerRegistry> {
    const updateData: Prisma.TrustedIssuerRegistryUpdateInput = {};
    if (data.issuerName !== undefined) updateData.issuerName = data.issuerName;
    if (data.credentialTypes !== undefined) updateData.credentialTypes = data.credentialTypes;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.revocationReason !== undefined) updateData.revocationReason = data.revocationReason;
    if (data.revokedAt !== undefined) updateData.revokedAt = data.revokedAt;

    const issuer = await this.prisma.trustedIssuerRegistry.update({
      where: { id },
      data: updateData,
    });
    return this.toEntity(issuer);
  }

  private toEntity(raw: {
    id: string;
    issuerDid: string;
    issuerName: string;
    credentialTypes: string[];
    active: boolean;
    revocationReason: string | null;
    activatedAt: Date;
    revokedAt: Date | null;
    updatedAt: Date;
  }): TrustedIssuerRegistry {
    return {
      id: raw.id,
      issuerDid: raw.issuerDid,
      issuerName: raw.issuerName,
      credentialTypes: raw.credentialTypes,
      active: raw.active,
      revocationReason: raw.revocationReason,
      activatedAt: raw.activatedAt,
      revokedAt: raw.revokedAt,
      updatedAt: raw.updatedAt,
    };
  }
}

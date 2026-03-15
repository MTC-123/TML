import type { PrismaClient } from '@prisma/client';
import type { IssuedCredential } from '@tml/types';

export class IssuedCredentialsRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    holderDid: string;
    holderActorId: string;
    credentialType: string;
    credentialJson: object;
    credentialHash: string;
    expiresAt?: Date;
  }): Promise<IssuedCredential> {
    const record = await this.prisma.issuedCredential.create({
      data: {
        holderDid: data.holderDid,
        holderActorId: data.holderActorId,
        credentialType: data.credentialType,
        credentialJson: data.credentialJson as object,
        credentialHash: data.credentialHash,
        expiresAt: data.expiresAt ?? null,
      },
    });
    return this.toEntity(record);
  }

  async findById(id: string): Promise<IssuedCredential | null> {
    const record = await this.prisma.issuedCredential.findUnique({
      where: { id },
    });
    return record ? this.toEntity(record) : null;
  }

  async findByHash(hash: string): Promise<IssuedCredential | null> {
    const record = await this.prisma.issuedCredential.findUnique({
      where: { credentialHash: hash },
    });
    return record ? this.toEntity(record) : null;
  }

  async findByHolder(holderDid: string): Promise<IssuedCredential[]> {
    const records = await this.prisma.issuedCredential.findMany({
      where: { holderDid },
      orderBy: { issuedAt: 'desc' },
    });
    return records.map((r) => this.toEntity(r));
  }

  async revoke(id: string, reason: string): Promise<IssuedCredential> {
    const record = await this.prisma.issuedCredential.update({
      where: { id },
      data: {
        status: 'revoked',
        revocationReason: reason,
        revokedAt: new Date(),
      },
    });
    return this.toEntity(record);
  }

  private toEntity(raw: {
    id: string;
    holderDid: string;
    holderActorId: string;
    credentialType: string;
    credentialJson: unknown;
    credentialHash: string;
    status: string;
    revocationReason: string | null;
    issuedAt: Date;
    expiresAt: Date | null;
    revokedAt: Date | null;
  }): IssuedCredential {
    return {
      id: raw.id,
      holderDid: raw.holderDid,
      holderActorId: raw.holderActorId,
      credentialType: raw.credentialType,
      credentialJson: raw.credentialJson as Record<string, unknown>,
      credentialHash: raw.credentialHash,
      status: raw.status as IssuedCredential['status'],
      revocationReason: raw.revocationReason,
      issuedAt: raw.issuedAt,
      expiresAt: raw.expiresAt,
      revokedAt: raw.revokedAt,
    };
  }
}

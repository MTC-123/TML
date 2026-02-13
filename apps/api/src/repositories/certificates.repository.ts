import type { PrismaClient, Prisma } from '@prisma/client';
import type { ComplianceCertificate, CertificateStatus } from '@tml/types';

export class CertificatesRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<{ data: ComplianceCertificate[]; total: number }> {
    const where: Prisma.ComplianceCertificateWhereInput = {};
    if (params.status) {
      where.status = params.status as CertificateStatus;
    }

    const [data, total] = await Promise.all([
      this.prisma.complianceCertificate.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.complianceCertificate.count({ where }),
    ]);

    return { data: data.map((c) => this.toEntity(c)), total };
  }

  async findById(id: string): Promise<ComplianceCertificate | null> {
    const cert = await this.prisma.complianceCertificate.findUnique({ where: { id } });
    return cert ? this.toEntity(cert) : null;
  }

  async findByHash(certificateHash: string): Promise<ComplianceCertificate | null> {
    const cert = await this.prisma.complianceCertificate.findUnique({
      where: { certificateHash },
    });
    return cert ? this.toEntity(cert) : null;
  }

  async findByMilestoneId(milestoneId: string): Promise<ComplianceCertificate | null> {
    const cert = await this.prisma.complianceCertificate.findUnique({
      where: { milestoneId },
    });
    return cert ? this.toEntity(cert) : null;
  }

  async create(data: {
    milestoneId: string;
    certificateHash: string;
    digitalSignature: string;
    status: string;
  }): Promise<ComplianceCertificate> {
    const cert = await this.prisma.complianceCertificate.create({
      data: {
        milestoneId: data.milestoneId,
        certificateHash: data.certificateHash,
        digitalSignature: data.digitalSignature,
        status: data.status as CertificateStatus,
      },
    });
    return this.toEntity(cert);
  }

  async update(id: string, data: Partial<ComplianceCertificate>): Promise<ComplianceCertificate> {
    const updateData: Prisma.ComplianceCertificateUpdateInput = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.tgrReference !== undefined) updateData.tgrReference = data.tgrReference;
    if (data.revocationReason !== undefined) updateData.revocationReason = data.revocationReason;
    if (data.revokedAt !== undefined) updateData.revokedAt = data.revokedAt;

    const cert = await this.prisma.complianceCertificate.update({
      where: { id },
      data: updateData,
    });
    return this.toEntity(cert);
  }

  private toEntity(raw: {
    id: string;
    milestoneId: string;
    certificateHash: string;
    digitalSignature: string;
    status: string;
    tgrReference: string | null;
    revocationReason: string | null;
    issuedAt: Date;
    revokedAt: Date | null;
  }): ComplianceCertificate {
    return {
      id: raw.id,
      milestoneId: raw.milestoneId,
      certificateHash: raw.certificateHash,
      digitalSignature: raw.digitalSignature,
      status: raw.status as CertificateStatus,
      tgrReference: raw.tgrReference,
      revocationReason: raw.revocationReason,
      issuedAt: raw.issuedAt,
      revokedAt: raw.revokedAt,
    };
  }
}

import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import type { ComplianceCertificate, CertificateStatus } from '@tml/types';
import { NotFoundError, ConflictError } from '@tml/types';
import {
  generateCertificate,
  verifyPayload,
  keyPairFromPrivateKey,
  type CertificateAttestation,
  type CertificateInput,
  type PaymentClearanceCertificate,
} from '@tml/crypto';
import type { CertificatesRepository } from '../repositories/certificates.repository.js';
import type { AttestationsRepository } from '../repositories/attestations.repository.js';
import type { MilestonesRepository } from '../repositories/milestones.repository.js';
import type { ProjectsRepository } from '../repositories/projects.repository.js';
import type { ActorsRepository } from '../repositories/actors.repository.js';
import type { AuditLogService } from './audit-log.service.js';
import type { Env } from '../config/env.js';

export class CertificatesService {
  constructor(
    private repo: CertificatesRepository,
    private attestationsRepo: AttestationsRepository,
    private milestonesRepo: MilestonesRepository,
    private projectsRepo: ProjectsRepository,
    private actorsRepo: ActorsRepository,
    private auditLog: AuditLogService,
    private env: Env,
  ) {}

  async list(params: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<Result<{ data: ComplianceCertificate[]; pagination: { page: number; limit: number; total: number } }>> {
    const { data, total } = await this.repo.findAll(params);
    return ok({ data, pagination: { page: params.page, limit: params.limit, total } });
  }

  async getById(id: string): Promise<Result<ComplianceCertificate>> {
    const cert = await this.repo.findById(id);
    if (!cert) {
      return err(new NotFoundError('ComplianceCertificate', id));
    }
    return ok(cert);
  }

  async verifyByHash(hash: string): Promise<Result<{ valid: boolean; certificate: ComplianceCertificate }>> {
    const cert = await this.repo.findByHash(hash);
    if (!cert) {
      return err(new NotFoundError('ComplianceCertificate', hash));
    }

    try {
      // Load system public key from env
      const systemPrivateKeyBytes = hexToBytes(this.env.SYSTEM_SIGNING_KEY_HEX);
      const { publicKey } = keyPairFromPrivateKey(systemPrivateKeyBytes);

      // Verify the signature over the stored certificate hash
      const hashBytes = new TextEncoder().encode(cert.certificateHash);
      const valid = verifyPayload(hashBytes, cert.digitalSignature, publicKey);

      return ok({ valid, certificate: cert });
    } catch {
      return ok({ valid: false, certificate: cert });
    }
  }

  async generateForMilestone(
    milestoneId: string,
    actorDid: string,
  ): Promise<Result<ComplianceCertificate>> {
    // Load milestone
    const milestone = await this.milestonesRepo.findById(milestoneId);
    if (!milestone || milestone.deletedAt) {
      return err(new NotFoundError('Milestone', milestoneId));
    }

    // Load project
    const project = await this.projectsRepo.findById(milestone.projectId);
    if (!project || project.deletedAt) {
      return err(new NotFoundError('Project', milestone.projectId));
    }

    // Check no certificate already exists
    const existingCert = await this.repo.findByMilestoneId(milestoneId);
    if (existingCert && existingCert.status !== 'revoked') {
      return err(new ConflictError('Certificate already exists for this milestone', {
        milestoneId,
        certificateId: existingCert.id,
      }));
    }

    // Load verified/submitted attestations
    const { data: attestations } = await this.attestationsRepo.findByMilestoneId(milestoneId, { page: 1, limit: 1000 });
    const validAttestations = attestations.filter((a) => a.status === 'submitted' || a.status === 'verified');

    // Build CertificateAttestation list
    const certAttestations: CertificateAttestation[] = [];
    for (const a of validAttestations) {
      const actor = await this.actorsRepo.findById(a.actorId);
      certAttestations.push({
        attestationId: a.id,
        actorDid: actor?.did ?? '',
        type: a.type,
        evidenceHash: a.evidenceHash,
        digitalSignature: a.digitalSignature,
        submittedAt: a.submittedAt.toISOString(),
      });
    }

    // Load system signing key
    const systemPrivateKeyBytes = hexToBytes(this.env.SYSTEM_SIGNING_KEY_HEX);

    // Generate certificate
    const certInput: CertificateInput = {
      milestoneId,
      projectId: project.id,
      attestations: certAttestations,
      systemPrivateKey: systemPrivateKeyBytes,
    };

    const paymentCert: PaymentClearanceCertificate = generateCertificate(certInput);

    // Store in DB
    const stored = await this.repo.create({
      milestoneId,
      certificateHash: paymentCert.certificateHash,
      digitalSignature: paymentCert.digitalSignature,
      status: 'issued',
    });

    await this.auditLog.log({
      entityType: 'ComplianceCertificate',
      entityId: stored.id,
      action: 'create',
      actorDid,
      payload: { milestoneId, projectId: project.id },
    });

    return ok(stored);
  }

  async revoke(
    id: string,
    reason: string,
    actorDid: string,
  ): Promise<Result<ComplianceCertificate>> {
    const cert = await this.repo.findById(id);
    if (!cert) {
      return err(new NotFoundError('ComplianceCertificate', id));
    }

    if (cert.status === 'revoked') {
      return err(new ConflictError('Certificate is already revoked', { id }));
    }

    const updated = await this.repo.update(id, {
      status: 'revoked',
      revocationReason: reason,
      revokedAt: new Date(),
    });

    await this.auditLog.log({
      entityType: 'ComplianceCertificate',
      entityId: id,
      action: 'revoke',
      actorDid,
      payload: { reason },
    });

    return ok(updated);
  }

  async updateTgrStatus(
    id: string,
    status: CertificateStatus,
    tgrReference: string | null,
    actorDid: string,
  ): Promise<Result<ComplianceCertificate>> {
    const cert = await this.repo.findById(id);
    if (!cert) {
      return err(new NotFoundError('ComplianceCertificate', id));
    }

    if (cert.status === 'revoked') {
      return err(new ConflictError('Cannot update TGR status of a revoked certificate', { id }));
    }

    const updated = await this.repo.update(id, {
      status,
      tgrReference,
    });

    await this.auditLog.log({
      entityType: 'ComplianceCertificate',
      entityId: id,
      action: 'update',
      actorDid,
      payload: { status, tgrReference },
    });

    return ok(updated);
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

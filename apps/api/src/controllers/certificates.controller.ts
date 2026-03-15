import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { CertificateStatus, RevokeCertificateInput } from '@tml/types';
import { NotFoundError } from '@tml/types';
import { loadEnv } from '../config/env.js';
import { CertificatesRepository } from '../repositories/certificates.repository.js';
import { AttestationsRepository } from '../repositories/attestations.repository.js';
import { MilestonesRepository } from '../repositories/milestones.repository.js';
import { ProjectsRepository } from '../repositories/projects.repository.js';
import { ActorsRepository } from '../repositories/actors.repository.js';
import { AuditLogsRepository } from '../repositories/audit-logs.repository.js';
import { AuditLogService } from '../services/audit-log.service.js';
import { CertificatesService } from '../services/certificates.service.js';
import { generateCertificatePdf, type CertificatePdfData } from '../services/pdf-certificate.service.js';

export class CertificatesController {
  private service: CertificatesService;
  private milestonesRepo: MilestonesRepository;
  private projectsRepo: ProjectsRepository;
  private attestationsRepo: AttestationsRepository;
  private actorsRepo: ActorsRepository;

  constructor(fastify: FastifyInstance) {
    const env = loadEnv();
    const certsRepo = new CertificatesRepository(fastify.prisma);
    const attestationsRepo = new AttestationsRepository(fastify.prisma);
    const milestonesRepo = new MilestonesRepository(fastify.prisma);
    const projectsRepo = new ProjectsRepository(fastify.prisma);
    const actorsRepo = new ActorsRepository(fastify.prisma);
    const auditLogService = new AuditLogService(new AuditLogsRepository(fastify.prisma));

    this.milestonesRepo = milestonesRepo;
    this.projectsRepo = projectsRepo;
    this.attestationsRepo = attestationsRepo;
    this.actorsRepo = actorsRepo;

    this.service = new CertificatesService(
      certsRepo,
      attestationsRepo,
      milestonesRepo,
      projectsRepo,
      actorsRepo,
      auditLogService,
      env,
    );
  }

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = request.query as { page: number; limit: number; status?: string };
    const result = await this.service.list(query);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const result = await this.service.getById(id);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async verifyByHash(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { hash } = request.params as { hash: string };
    const result = await this.service.verifyByHash(hash);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async revoke(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const { revocationReason } = request.body as RevokeCertificateInput;
    const result = await this.service.revoke(id, revocationReason, request.actor.did);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async updateTgrStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const { status, tgrReference } = request.body as { status: CertificateStatus; tgrReference?: string };
    const result = await this.service.updateTgrStatus(id, status, tgrReference ?? null, request.actor.did);
    if (!result.ok) {
      throw result.error;
    }
    reply.send(result.value);
  }

  async downloadPdf(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };

    // Fetch certificate
    const certResult = await this.service.getById(id);
    if (!certResult.ok) {
      throw certResult.error;
    }
    const cert = certResult.value;

    // Fetch milestone
    const milestone = await this.milestonesRepo.findById(cert.milestoneId);
    if (!milestone) {
      throw new NotFoundError('Milestone', cert.milestoneId);
    }

    // Fetch project
    const project = await this.projectsRepo.findById(milestone.projectId);
    if (!project) {
      throw new NotFoundError('Project', milestone.projectId);
    }

    // Fetch attestations for the milestone
    const { data: attestations } = await this.attestationsRepo.findByMilestoneId(cert.milestoneId, {
      page: 1,
      limit: 1000,
    });

    // Resolve actor DIDs for each attestation
    const attestationData: CertificatePdfData['attestations'] = [];
    for (const att of attestations) {
      const actor = await this.actorsRepo.findById(att.actorId);
      attestationData.push({
        type: att.type,
        actorDid: actor?.did ?? att.actorId,
        status: att.status,
        createdAt: att.submittedAt,
      });
    }

    const pdfData: CertificatePdfData = {
      certificateId: cert.id,
      certificateHash: cert.certificateHash,
      digitalSignature: cert.digitalSignature,
      status: cert.status,
      issuedAt: cert.issuedAt,
      tgrReference: cert.tgrReference,
      milestone: {
        sequenceNumber: milestone.sequenceNumber,
        description: milestone.description,
        deadline: milestone.deadline,
      },
      project: {
        name: project.name,
        region: project.region,
        budget: Number(project.budget),
        donor: project.donor,
      },
      attestations: attestationData,
    };

    const pdfBuffer = await generateCertificatePdf(pdfData);

    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="TML-Certificate-${id}.pdf"`)
      .header('Content-Length', pdfBuffer.length)
      .send(pdfBuffer);
  }
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { VerificationService } from '../services/verification.service.js';
import { CertificatesRepository } from '../repositories/certificates.repository.js';
import { MilestonesRepository } from '../repositories/milestones.repository.js';
import { ProjectsRepository } from '../repositories/projects.repository.js';

const verifyHashSchema = z.object({
  hash: z.string().min(1),
});

const verifyQrSchema = z.object({
  payload: z.string().min(1),
});

const createPresentationDefSchema = z.object({
  purpose: z.string().min(1),
  requiredCredentialTypes: z.array(z.string().min(1)).min(1),
  requiredAttributes: z.array(z.string()).optional(),
});

const createAuthRequestSchema = z.object({
  presentationDefinitionId: z.string().min(1),
  nonce: z.string().min(1),
  responseUri: z.string().url(),
  state: z.string().min(1),
  clientId: z.string().min(1),
  presentationDefinition: z.record(z.unknown()),
});

const validateAuthResponseSchema = z.object({
  vpToken: z.string().min(1),
  presentationSubmission: z.object({
    id: z.string(),
    definition_id: z.string(),
    descriptor_map: z.array(z.object({
      id: z.string(),
      format: z.literal('ldp_vp'),
      path: z.string(),
      path_nested: z.object({
        format: z.literal('ldp_vc'),
        path: z.string(),
      }).optional(),
    })),
  }),
  state: z.string().min(1),
});

export class VerificationController {
  private service: VerificationService;

  constructor(fastify: FastifyInstance) {
    const certificatesRepo = new CertificatesRepository(fastify.prisma);
    const milestonesRepo = new MilestonesRepository(fastify.prisma);
    const projectsRepo = new ProjectsRepository(fastify.prisma);
    this.service = new VerificationService(certificatesRepo, milestonesRepo, projectsRepo, fastify.redis);
  }

  async verifyByHash(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = request.query as z.infer<typeof verifyHashSchema>;
    const result = await this.service.verifyCertificateByHash(query.hash);

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }

  async verifyByQr(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as z.infer<typeof verifyQrSchema>;
    const result = await this.service.verifyQrPayload(body.payload);

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }

  async createPresentationDefinition(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as z.infer<typeof createPresentationDefSchema>;
    const result = await this.service.createPresentationDefinition(body);

    if (!result.ok) {
      throw result.error;
    }

    reply.code(201).send({ data: result.value });
  }

  async createAuthorizationRequest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as z.infer<typeof createAuthRequestSchema>;
    const result = await this.service.createAuthorizationRequest({
      presentationDefinition: body.presentationDefinition as unknown as Parameters<typeof this.service.createAuthorizationRequest>[0]['presentationDefinition'],
      nonce: body.nonce,
      responseUri: body.responseUri,
      state: body.state,
      clientId: body.clientId,
    });

    if (!result.ok) {
      throw result.error;
    }

    reply.code(201).send({ data: result.value });
  }

  async validateAuthorizationResponse(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as z.infer<typeof validateAuthResponseSchema>;
    const result = await this.service.validateAuthorizationResponse({
      vpToken: body.vpToken,
      presentationSubmission: body.presentationSubmission,
      state: body.state,
    });

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }
}

export {
  verifyHashSchema,
  verifyQrSchema,
  createPresentationDefSchema,
  createAuthRequestSchema,
  validateAuthResponseSchema,
};

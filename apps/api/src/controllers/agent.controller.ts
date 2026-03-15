import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AgentService } from '../services/agent.service.js';
import { AgentConnectionsRepository } from '../repositories/agent-connections.repository.js';
import { loadEnv } from '../config.js';

const createInvitationSchema = z.object({
  label: z.string().min(1).max(100),
  ttlSeconds: z.number().int().positive().max(3600).optional(),
});

const acceptInvitationParamsSchema = z.object({
  id: z.string().min(1),
});

const createProofRequestSchema = z.object({
  requestedAttributes: z.array(z.object({
    name: z.string().min(1),
    credentialType: z.string().min(1),
    restrictions: z.object({
      issuerDid: z.string().optional(),
    }).optional(),
  })).min(1),
  connectionId: z.string().uuid().optional(),
  ttlSeconds: z.number().int().positive().max(3600).optional(),
});

const createCredentialOfferSchema = z.object({
  credential: z.record(z.unknown()),
  holderDid: z.string().min(1),
});

const claimOfferParamsSchema = z.object({
  id: z.string().min(1),
});

const proofRequestParamsSchema = z.object({
  id: z.string().min(1),
});

export class AgentController {
  private service: AgentService;

  constructor(fastify: FastifyInstance) {
    const connectionsRepo = new AgentConnectionsRepository(fastify.prisma);
    const env = loadEnv();
    this.service = new AgentService(fastify.redis, connectionsRepo, env);
  }

  async createInvitation(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as z.infer<typeof createInvitationSchema>;
    const result = await this.service.createInvitation({
      inviterDid: request.actor.did,
      label: body.label,
      ttlSeconds: body.ttlSeconds,
    });

    if (!result.ok) {
      throw result.error;
    }

    reply.code(201).send({ data: result.value });
  }

  async acceptInvitation(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof acceptInvitationParamsSchema>;
    const result = await this.service.acceptInvitation({
      invitationId: params.id,
      acceptorDid: request.actor.did,
    });

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }

  async getConnections(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await this.service.getConnections(request.actor.did);

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }

  async createProofRequest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as z.infer<typeof createProofRequestSchema>;
    const result = await this.service.createProofRequest({
      requesterDid: request.actor.did,
      requestedAttributes: body.requestedAttributes,
      connectionId: body.connectionId,
      ttlSeconds: body.ttlSeconds,
    });

    if (!result.ok) {
      throw result.error;
    }

    reply.code(201).send({ data: result.value });
  }

  async getProofRequest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof proofRequestParamsSchema>;
    const result = await this.service.getProofRequest(params.id);

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }

  async createCredentialOffer(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as z.infer<typeof createCredentialOfferSchema>;
    const result = await this.service.createConnectionlessCredentialOffer({
      credential: body.credential as unknown as Parameters<typeof this.service.createConnectionlessCredentialOffer>[0]['credential'],
      holderDid: body.holderDid,
    });

    if (!result.ok) {
      throw result.error;
    }

    reply.code(201).send({ data: result.value });
  }

  async claimCredentialOffer(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as z.infer<typeof claimOfferParamsSchema>;
    const result = await this.service.claimConnectionlessCredential(params.id, request.actor.did);

    if (!result.ok) {
      throw result.error;
    }

    reply.send({ data: result.value });
  }
}

export {
  createInvitationSchema,
  acceptInvitationParamsSchema,
  createProofRequestSchema,
  createCredentialOfferSchema,
  claimOfferParamsSchema,
  proofRequestParamsSchema,
};

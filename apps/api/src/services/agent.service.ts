import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import { NotFoundError, ValidationError } from '@tml/types';
import type { AgentConnection } from '@tml/types';
import { sha256Hex, signPayload, verifyPayload, extractPublicKey, keyPairFromPrivateKey, createDID } from '@tml/crypto';
import type { VerifiableCredential } from '@tml/crypto';
import type { AgentConnectionsRepository } from '../repositories/agent-connections.repository.js';
import type { Env } from '../config/env.js';

interface RedisClient {
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
  get(key: string): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
}

export interface ConnectionInvitation {
  id: string;
  type: 'ConnectionInvitation';
  serviceEndpoint: string;
  recipientDid: string;
  label: string;
  createdAt: string;
  expiresAt: string;
  signature: string;
}

export interface ProofRequest {
  id: string;
  type: 'ProofRequest';
  requesterDid: string;
  requestedAttributes: RequestedAttribute[];
  connectionId: string | null;
  nonce: string;
  createdAt: string;
  expiresAt: string;
}

export interface RequestedAttribute {
  name: string;
  credentialType: string;
  restrictions?: { issuerDid?: string };
}

export class AgentService {
  constructor(
    private redis: RedisClient,
    private connectionsRepo: AgentConnectionsRepository,
    private env: Env,
  ) {}

  async createInvitation(params: {
    inviterDid: string;
    label: string;
    ttlSeconds?: number;
  }): Promise<Result<ConnectionInvitation>> {
    const ttl = params.ttlSeconds ?? 300;
    const id = sha256Hex(`invitation:${params.inviterDid}:${Date.now()}:${Math.random()}`);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    const serviceEndpoint = `${this.env.MOSIP_REDIRECT_URI.replace('/callback', '')}/api/v1/agent`;

    const invitation: ConnectionInvitation = {
      id,
      type: 'ConnectionInvitation',
      serviceEndpoint,
      recipientDid: params.inviterDid,
      label: params.label,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      signature: '',
    };

    // Sign the invitation
    const privateKeyBytes = Buffer.from(this.env.SYSTEM_SIGNING_KEY_HEX, 'hex');
    const keyPair = keyPairFromPrivateKey(privateKeyBytes);
    const signingInput = JSON.stringify({ ...invitation, signature: undefined });
    const hash = sha256Hex(signingInput);
    const hashBytes = new TextEncoder().encode(hash);
    invitation.signature = signPayload(hashBytes, keyPair.privateKey);

    // Store in Redis
    await this.redis.set(`agent:invitation:${id}`, JSON.stringify(invitation), 'EX', ttl);

    // Create initial connection record
    await this.connectionsRepo.create({
      initiatorDid: params.inviterDid,
      state: 'invited',
      label: params.label,
    });

    return ok(invitation);
  }

  async acceptInvitation(params: {
    invitationId: string;
    acceptorDid: string;
  }): Promise<Result<AgentConnection>> {
    const stored = await this.redis.get(`agent:invitation:${params.invitationId}`);
    if (!stored) {
      return err(new NotFoundError('ConnectionInvitation', params.invitationId));
    }

    const invitation = JSON.parse(stored) as ConnectionInvitation;

    // Check expiration
    if (new Date(invitation.expiresAt) < new Date()) {
      await this.redis.del(`agent:invitation:${params.invitationId}`);
      return err(new ValidationError('Invitation has expired'));
    }

    // Verify signature
    const privateKeyBytes = Buffer.from(this.env.SYSTEM_SIGNING_KEY_HEX, 'hex');
    const keyPair = keyPairFromPrivateKey(privateKeyBytes);
    const systemDid = createDID(keyPair.publicKey);
    const systemPublicKey = extractPublicKey(systemDid);

    const signingInput = JSON.stringify({ ...invitation, signature: undefined });
    const hash = sha256Hex(signingInput);
    const hashBytes = new TextEncoder().encode(hash);
    const sigValid = verifyPayload(hashBytes, invitation.signature, systemPublicKey);

    if (!sigValid) {
      return err(new ValidationError('Invalid invitation signature'));
    }

    // Create connection record
    const connection = await this.connectionsRepo.create({
      initiatorDid: invitation.recipientDid,
      responderDid: params.acceptorDid,
      state: 'connected',
      label: invitation.label,
    });

    // Remove invitation from Redis
    await this.redis.del(`agent:invitation:${params.invitationId}`);

    return ok(connection);
  }

  async getConnections(did: string): Promise<Result<AgentConnection[]>> {
    const connections = await this.connectionsRepo.findByDid(did);
    return ok(connections);
  }

  async createConnectionlessCredentialOffer(params: {
    credential: VerifiableCredential;
    holderDid: string;
  }): Promise<Result<{ offerId: string; offerUrl: string }>> {
    const offerId = sha256Hex(`offer:${params.holderDid}:${Date.now()}:${Math.random()}`);

    const offerData = {
      credential: params.credential,
      holderDid: params.holderDid,
    };

    await this.redis.set(`agent:offer:${offerId}`, JSON.stringify(offerData), 'EX', 600);

    const serviceEndpoint = `${this.env.MOSIP_REDIRECT_URI.replace('/callback', '')}/api/v1/agent`;
    const offerUrl = `${serviceEndpoint}/credential-offers/${offerId}/claim`;

    return ok({ offerId, offerUrl });
  }

  async claimConnectionlessCredential(
    offerId: string,
    claimerDid: string,
  ): Promise<Result<VerifiableCredential>> {
    const stored = await this.redis.get(`agent:offer:${offerId}`);
    if (!stored) {
      return err(new NotFoundError('CredentialOffer', offerId));
    }

    const offerData = JSON.parse(stored) as { credential: VerifiableCredential; holderDid: string };

    if (offerData.holderDid !== claimerDid) {
      return err(new ValidationError('Claimer DID does not match offer holder'));
    }

    await this.redis.del(`agent:offer:${offerId}`);
    return ok(offerData.credential);
  }

  async createProofRequest(params: {
    requesterDid: string;
    requestedAttributes: RequestedAttribute[];
    connectionId?: string;
    ttlSeconds?: number;
  }): Promise<Result<ProofRequest>> {
    const ttl = params.ttlSeconds ?? 300;
    const id = sha256Hex(`proof:${params.requesterDid}:${Date.now()}:${Math.random()}`);
    const nonce = sha256Hex(`nonce:${Date.now()}:${Math.random()}`);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    const proofRequest: ProofRequest = {
      id,
      type: 'ProofRequest',
      requesterDid: params.requesterDid,
      requestedAttributes: params.requestedAttributes,
      connectionId: params.connectionId ?? null,
      nonce,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await this.redis.set(`agent:proof:${id}`, JSON.stringify(proofRequest), 'EX', ttl);

    return ok(proofRequest);
  }

  async getProofRequest(proofRequestId: string): Promise<Result<ProofRequest>> {
    const stored = await this.redis.get(`agent:proof:${proofRequestId}`);
    if (!stored) {
      return err(new NotFoundError('ProofRequest', proofRequestId));
    }
    return ok(JSON.parse(stored) as ProofRequest);
  }
}

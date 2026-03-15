import type { Result } from '../lib/result.js';
import { ok } from '../lib/result.js';
import type { ComplianceCertificate, Milestone, Project, PresentationDefinition, PresentationSubmission } from '@tml/types';
import { decodeQrPayload, validateQrPayloadIntegrity, verifyPresentation, sha256Hex } from '@tml/crypto';
import type { VerifiablePresentation, PresentationVerificationResult } from '@tml/crypto';
import type { CertificatesRepository } from '../repositories/certificates.repository.js';
import type { MilestonesRepository } from '../repositories/milestones.repository.js';
import type { ProjectsRepository } from '../repositories/projects.repository.js';

interface RedisClient {
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
  get(key: string): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
}

export interface CertificateVerificationResult {
  valid: boolean;
  certificate: ComplianceCertificate | null;
  milestone: Milestone | null;
  project: Project | null;
  errors: string[];
}

export interface OpenID4VPVerificationResult {
  valid: boolean;
  presentationResult: PresentationVerificationResult | null;
  matchedAttributes: Record<string, unknown>;
  errors: string[];
}

export class VerificationService {
  constructor(
    private certificatesRepo: CertificatesRepository,
    private milestonesRepo: MilestonesRepository,
    private projectsRepo: ProjectsRepository,
    private redis: RedisClient,
  ) {}

  async verifyCertificateByHash(hash: string): Promise<Result<CertificateVerificationResult>> {
    const certificate = await this.certificatesRepo.findByHash(hash);
    if (!certificate) {
      return ok({
        valid: false,
        certificate: null,
        milestone: null,
        project: null,
        errors: ['Certificate not found'],
      });
    }

    if (certificate.status === 'revoked') {
      return ok({
        valid: false,
        certificate,
        milestone: null,
        project: null,
        errors: ['Certificate has been revoked'],
      });
    }

    const milestone = await this.milestonesRepo.findById(certificate.milestoneId);
    const project = milestone ? await this.projectsRepo.findById(milestone.projectId) : null;

    return ok({
      valid: true,
      certificate,
      milestone,
      project,
      errors: [],
    });
  }

  async verifyQrPayload(encodedPayload: string): Promise<Result<CertificateVerificationResult>> {
    const payload = decodeQrPayload(encodedPayload);
    if (!payload) {
      return ok({
        valid: false,
        certificate: null,
        milestone: null,
        project: null,
        errors: ['Invalid QR payload format'],
      });
    }

    // Check timestamp freshness (reject if > 24 hours old)
    const now = Math.floor(Date.now() / 1000);
    const maxAge = 86400; // 24 hours
    if (now - payload.timestamp > maxAge) {
      return ok({
        valid: false,
        certificate: null,
        milestone: null,
        project: null,
        errors: ['QR payload has expired (older than 24 hours)'],
      });
    }

    if (payload.type === 'CERT') {
      const certResult = await this.verifyCertificateByHash(payload.hash);
      if (!certResult.ok) return certResult;

      // Validate signature prefix
      if (certResult.value.certificate) {
        const sigValid = validateQrPayloadIntegrity(payload, certResult.value.certificate.digitalSignature);
        if (!sigValid) {
          return ok({
            ...certResult.value,
            valid: false,
            errors: ['Signature prefix mismatch — possible tampering'],
          });
        }
      }

      return certResult;
    }

    return ok({
      valid: false,
      certificate: null,
      milestone: null,
      project: null,
      errors: [`Unsupported QR payload type: ${payload.type}`],
    });
  }

  async createPresentationDefinition(params: {
    purpose: string;
    requiredCredentialTypes: string[];
    requiredAttributes?: string[];
  }): Promise<Result<PresentationDefinition>> {
    const id = sha256Hex(`pd:${Date.now()}:${Math.random()}`);

    const input_descriptors = params.requiredCredentialTypes.map((credType, index) => ({
      id: `descriptor_${index}`,
      name: credType,
      purpose: params.purpose,
      constraints: {
        fields: [
          {
            path: ['$.type'],
            filter: {
              type: 'string',
              const: credType,
            },
          },
          ...(params.requiredAttributes ?? []).map((attr) => ({
            path: [`$.credentialSubject.${attr}`],
            purpose: `Required attribute: ${attr}`,
          })),
        ],
      },
    }));

    return ok({ id, name: params.purpose, purpose: params.purpose, input_descriptors });
  }

  async createAuthorizationRequest(params: {
    presentationDefinition: PresentationDefinition;
    nonce: string;
    responseUri: string;
    state: string;
    clientId: string;
  }): Promise<Result<{
    response_type: 'vp_token';
    client_id: string;
    response_uri: string;
    response_mode: 'direct_post';
    presentation_definition: PresentationDefinition;
    nonce: string;
    state: string;
  }>> {
    // Store nonce + state in Redis for later validation (5 minute TTL)
    await this.redis.set(
      `openid4vp:state:${params.state}`,
      JSON.stringify({ nonce: params.nonce, definitionId: params.presentationDefinition.id }),
      'EX',
      300,
    );

    return ok({
      response_type: 'vp_token' as const,
      client_id: params.clientId,
      response_uri: params.responseUri,
      response_mode: 'direct_post' as const,
      presentation_definition: params.presentationDefinition,
      nonce: params.nonce,
      state: params.state,
    });
  }

  async validateAuthorizationResponse(params: {
    vpToken: string;
    presentationSubmission: PresentationSubmission;
    state: string;
  }): Promise<Result<OpenID4VPVerificationResult>> {
    // Look up stored nonce by state
    const stored = await this.redis.get(`openid4vp:state:${params.state}`);
    if (!stored) {
      return ok({
        valid: false,
        presentationResult: null,
        matchedAttributes: {},
        errors: ['Invalid or expired state parameter'],
      });
    }

    const { nonce } = JSON.parse(stored) as { nonce: string; definitionId: string };

    // Parse VP token
    let presentation: VerifiablePresentation;
    try {
      presentation = JSON.parse(params.vpToken) as VerifiablePresentation;
    } catch {
      return ok({
        valid: false,
        presentationResult: null,
        matchedAttributes: {},
        errors: ['Invalid VP token format'],
      });
    }

    // Verify presentation
    const presentationResult = verifyPresentation(presentation, nonce);

    // Extract matched attributes from credentials
    const matchedAttributes: Record<string, unknown> = {};
    for (const cred of presentation.verifiableCredential) {
      const subject = cred.credentialSubject as unknown as Record<string, unknown>;
      for (const [key, value] of Object.entries(subject)) {
        matchedAttributes[key] = value;
      }
    }

    // Clean up state
    await this.redis.del(`openid4vp:state:${params.state}`);

    return ok({
      valid: presentationResult.valid,
      presentationResult,
      matchedAttributes,
      errors: presentationResult.presentationErrors,
    });
  }
}

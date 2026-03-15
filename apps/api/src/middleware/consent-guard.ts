import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ConsentService } from '../services/consent.service.js';
import type { ConsentPurpose } from '@tml/types';

const CONSENT_MAP: Record<string, ConsentPurpose> = {
  'POST:/api/v1/attestations': 'attestation_submission',
  'POST:/api/v1/credentials': 'credential_issuance',
  'GET:/api/v1/credentials/holder': 'data_sharing',
};

export function consentGuard(consentService: ConsentService): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const routeKey = `${request.method}:${request.routeOptions.url}`;
    const requiredPurpose = CONSENT_MAP[routeKey];
    if (!requiredPurpose) return;
    if (!request.actor) return;

    const hasConsent = await consentService.checkConsent(
      request.actor.actorId,
      requiredPurpose,
    );
    if (!hasConsent) {
      reply.status(403).send({
        error: 'ConsentRequired',
        message: `Consent for '${requiredPurpose}' is required.`,
        consentUrl: '/api/v1/consent/grant',
      });
    }
  };
}

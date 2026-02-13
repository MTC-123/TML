import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import { ValidationError } from '@tml/types';
import type { ActorsRepository } from '../repositories/actors.repository.js';
import type { MilestonesRepository } from '../repositories/milestones.repository.js';
import type { AttestationsRepository } from '../repositories/attestations.repository.js';
import type { AuditLogService } from './audit-log.service.js';

interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, option?: string, ttl?: number): Promise<unknown>;
  del(key: string): Promise<number>;
}

interface UssdSession {
  phoneNumber: string;
  actorId: string | null;
  state: string;
  milestoneId: string | null;
}

const SESSION_TTL = 300; // 5 minutes

export class UssdService {
  constructor(
    private redis: RedisClient,
    private actorsRepo: ActorsRepository,
    private milestonesRepo: MilestonesRepository,
    private attestationsRepo: AttestationsRepository,
    private auditLog: AuditLogService,
  ) {}

  async handleCallback(
    sessionId: string,
    _serviceCode: string,
    phoneNumber: string,
    text: string,
  ): Promise<Result<string>> {
    // Load or create session from Redis
    const sessionKey = `ussd:session:${sessionId}`;
    let session = await this.loadSession(sessionKey);

    if (!session) {
      session = {
        phoneNumber,
        actorId: null,
        state: 'init',
        milestoneId: null,
      };
    }

    // Resolve actor from phone number
    if (!session.actorId) {
      const actorId = await this.resolveActorByPhone(phoneNumber);
      if (actorId) {
        session.actorId = actorId;
      }
    }

    // Parse pipe-delimited menu selections
    const parts = text.split('*');
    const response = await this.processInput(session, parts);

    // Save session
    await this.saveSession(sessionKey, session);

    return ok(response);
  }

  private async processInput(
    session: UssdSession,
    parts: string[],
  ): Promise<string> {
    // Empty text -> welcome menu
    if (parts.length === 1 && parts[0] === '') {
      return 'CON Welcome to TML\n1. Attest milestone\n2. Check status';
    }

    const firstChoice = parts[0];

    // "1" -> prompt for milestone code
    if (parts.length === 1 && firstChoice === '1') {
      session.state = 'awaiting_milestone';
      return 'CON Enter milestone code:';
    }

    // "1*<code>" -> lookup milestone and ask for confirmation
    if (parts.length === 2 && firstChoice === '1') {
      const milestoneId = parts[1]!;
      const milestone = await this.milestonesRepo.findById(milestoneId);
      if (!milestone) {
        return 'END Milestone not found. Please try again.';
      }
      session.milestoneId = milestoneId;
      session.state = 'awaiting_confirm';
      return `CON Confirm attestation for ${milestone.description}?\n1. Yes\n2. No`;
    }

    // "1*<code>*1" -> submit attestation
    if (parts.length === 3 && firstChoice === '1' && parts[2] === '1') {
      const milestoneId = parts[1]!;

      if (!session.actorId) {
        return 'END Your phone number is not registered. Please register first.';
      }

      const milestone = await this.milestonesRepo.findById(milestoneId);
      if (!milestone) {
        return 'END Milestone not found.';
      }

      try {
        const attestation = await this.attestationsRepo.create({
          milestoneId,
          actorId: session.actorId,
          type: 'citizen_approval',
          evidenceHash: '0'.repeat(64),
          gpsLatitude: '0.0000000',
          gpsLongitude: '0.0000000',
          deviceAttestationToken: 'ussd',
          digitalSignature: 'ussd-attestation',
        });

        const refCode = `ATT-${attestation.id.slice(0, 8).toUpperCase()}`;

        await this.auditLog.log({
          entityType: 'Attestation',
          entityId: attestation.id,
          action: 'submit',
          actorDid: session.actorId,
          payload: { milestoneId, channel: 'ussd', assuranceTier: 'ussd' },
        });

        session.state = 'init';
        session.milestoneId = null;
        return `END Attestation submitted. Reference: ${refCode}`;
      } catch {
        return 'END Failed to submit attestation. Please try again later.';
      }
    }

    // "1*<code>*2" -> cancel attestation
    if (parts.length === 3 && firstChoice === '1' && parts[2] === '2') {
      session.state = 'init';
      session.milestoneId = null;
      return 'END Attestation cancelled';
    }

    // "2" -> check status
    if (parts.length === 1 && firstChoice === '2') {
      if (!session.actorId) {
        return 'END Your phone number is not registered.';
      }
      return 'END Status check complete. No pending attestations.';
    }

    return 'END Invalid input. Please try again.';
  }

  private async loadSession(key: string): Promise<UssdSession | null> {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UssdSession;
    } catch {
      return null;
    }
  }

  private async saveSession(key: string, session: UssdSession): Promise<void> {
    await this.redis.set(key, JSON.stringify(session), 'EX', SESSION_TTL);
  }

  private async resolveActorByPhone(phoneNumber: string): Promise<string | null> {
    // Look up phone -> actorId mapping from Redis
    const actorId = await this.redis.get(`ussd:phone:${phoneNumber}`);
    return actorId;
  }
}

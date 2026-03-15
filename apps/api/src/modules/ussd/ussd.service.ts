import type { Result } from '../../lib/result.js';
import { ok } from '../../lib/result.js';
import { sanitizeUssdInput, sanitizeProjectCode, sanitizeOtp } from './input-sanitizer.js';
import { SessionStore, type UssdSession, type RedisClient } from './session-store.js';
import { OtpManager } from './otp-manager.js';
import { ProjectCodeStore } from './project-code.js';
import type { SmsGateway } from './sms-gateway.js';
import type { ActorsRepository } from '../../repositories/actors.repository.js';
import type { MilestonesRepository } from '../../repositories/milestones.repository.js';
import type { ProjectsRepository } from '../../repositories/projects.repository.js';
import type { AttestationsService } from '../../services/attestations.service.js';
import type { AuditLogService } from '../../services/audit-log.service.js';
import { type UssdLocale, getStrings, detectLocaleFromPhone } from './ussd-locales.js';

const RATE_LIMIT_TTL = 86400; // 24 hours

/** Map language-selection input to locale. Options 3 and 4 vary per current locale. */
const LANGUAGE_SWITCH: Record<UssdLocale, Record<string, UssdLocale>> = {
  fr: { '3': 'ar', '4': 'amz' },
  ar: { '3': 'fr', '4': 'amz' },
  amz: { '3': 'fr', '4': 'ar' },
};

export class UssdService {
  constructor(
    private redis: RedisClient,
    private sessionStore: SessionStore,
    private otpManager: OtpManager,
    private projectCodeStore: ProjectCodeStore,
    private smsGateway: SmsGateway,
    private actorsRepo: ActorsRepository,
    private milestonesRepo: MilestonesRepository,
    private projectsRepo: ProjectsRepository,
    private attestationsService: AttestationsService,
    private auditLog: AuditLogService,
  ) {}

  async handleCallback(
    sessionId: string,
    _serviceCode: string,
    phoneNumber: string,
    text: string,
  ): Promise<Result<string>> {
    const sanitized = sanitizeUssdInput(text);
    const parts = sanitized.split('*');

    // Load or create session
    let session = await this.sessionStore.load(sessionId);
    if (!session) {
      session = {
        sessionId,
        phoneNumber,
        actorId: null,
        actorDid: null,
        state: 'init',
        projectId: null,
        projectName: null,
        milestoneId: null,
        milestoneDescription: null,
        vote: null,
        locale: detectLocaleFromPhone(phoneNumber),
      };
    }

    let response: string;

    try {
      response = await this.dispatch(session, parts);
    } catch {
      const strings = getStrings(session.locale || 'fr');
      response = strings.systemError;
    }

    // Save session (unless completed)
    if (!response.startsWith('END')) {
      await this.sessionStore.save(session);
    } else {
      await this.sessionStore.destroy(sessionId);
    }

    return ok(response);
  }

  private async dispatch(session: UssdSession, parts: string[]): Promise<string> {
    const locale = session.locale || 'fr';
    const strings = getStrings(locale);

    // Empty text → welcome
    if (parts.length === 1 && parts[0] === '') {
      return this.screenWelcome(strings);
    }

    // Language switch (options 3 or 4 from welcome menu)
    if (parts.length === 1 && (parts[0] === '3' || parts[0] === '4')) {
      const newLocale = LANGUAGE_SWITCH[locale]?.[parts[0]!];
      if (newLocale) {
        session.locale = newLocale;
        return this.screenWelcome(getStrings(newLocale));
      }
    }

    // Help
    if (parts.length === 1 && parts[0] === '2') {
      return this.screenHelp(strings);
    }

    // Enter project code prompt
    if (parts.length === 1 && parts[0] === '1') {
      return this.screenEnterProjectCode(session, strings);
    }

    // Project code entered
    if (parts.length === 2 && parts[0] === '1') {
      return this.handleProjectCode(session, parts[1]!, strings);
    }

    // For steps 3+ we need project/milestone context resolved
    // AfricasTalking sends accumulated text, so session may already have this
    // from a previous callback, but we ensure it's populated.
    if (parts.length >= 3 && parts[0] === '1') {
      const ensured = await this.ensureProjectContext(session, parts[1]!, strings);
      if (ensured) return ensured;
    }

    // Vote: Oui
    if (parts.length === 3 && parts[0] === '1' && parts[2] === '1') {
      return this.handleVoteOui(session, strings);
    }

    // Vote: Non
    if (parts.length === 3 && parts[0] === '1' && parts[2] === '2') {
      return this.handleVoteNon(session, strings);
    }

    // Vote: Pas sûr
    if (parts.length === 3 && parts[0] === '1' && parts[2] === '3') {
      return this.handleVotePasSur(strings);
    }

    // OTP entered
    if (parts.length === 4 && parts[0] === '1' && parts[2] === '1') {
      return this.handleOtp(session, parts[3]!, strings);
    }

    return strings.invalidInput;
  }

  /** Ensure session has project/milestone context. Returns error string if resolution fails, null on success. */
  private async ensureProjectContext(session: UssdSession, rawCode: string, strings: ReturnType<typeof getStrings>): Promise<string | null> {
    if (session.projectId && session.milestoneId) return null;

    const code = sanitizeProjectCode(rawCode);
    if (!code) return strings.invalidCode;

    const projectId = await this.projectCodeStore.resolve(code);
    if (!projectId) return strings.projectNotFound;

    const project = await this.projectsRepo.findById(projectId);
    if (!project || project.deletedAt) return strings.projectNotFound;

    const milestone = await this.milestonesRepo.findActiveByProjectId(projectId);
    if (!milestone) return strings.noActiveMilestone;

    session.projectId = projectId;
    session.projectName = project.name;
    session.milestoneId = milestone.id;
    session.milestoneDescription = milestone.description;
    return null;
  }

  private screenWelcome(strings: ReturnType<typeof getStrings>): string {
    return strings.welcome;
  }

  private screenHelp(strings: ReturnType<typeof getStrings>): string {
    return strings.helpText;
  }

  private screenEnterProjectCode(session: UssdSession, strings: ReturnType<typeof getStrings>): string {
    session.state = 'awaiting_project_code';
    return strings.enterProjectCode;
  }

  private async handleProjectCode(session: UssdSession, rawCode: string, strings: ReturnType<typeof getStrings>): Promise<string> {
    const code = sanitizeProjectCode(rawCode);
    if (!code) {
      return strings.invalidCode;
    }

    // Resolve project code → projectId
    const projectId = await this.projectCodeStore.resolve(code);
    if (!projectId) {
      return strings.projectNotFound;
    }

    // Lookup project
    const project = await this.projectsRepo.findById(projectId);
    if (!project || project.deletedAt) {
      return strings.projectNotFound;
    }

    // Find active milestone
    const milestone = await this.milestonesRepo.findActiveByProjectId(projectId);
    if (!milestone) {
      return strings.noActiveMilestone;
    }

    // Update session
    session.state = 'awaiting_vote';
    session.projectId = projectId;
    session.projectName = project.name;
    session.milestoneId = milestone.id;
    session.milestoneDescription = milestone.description;

    return strings.votePrompt(project.name, milestone.description);
  }

  private async handleVoteOui(session: UssdSession, strings: ReturnType<typeof getStrings>): Promise<string> {
    // Resolve phone → actor
    if (!session.actorId) {
      const actorId = await this.redis.get(`ussd:phone:${session.phoneNumber}`);
      if (!actorId) {
        return strings.notRegistered;
      }
      const actor = await this.actorsRepo.findById(actorId);
      if (!actor) {
        return strings.notRegistered;
      }
      session.actorId = actorId;
      session.actorDid = actor.did;
    }

    // Rate limit check
    if (session.actorId && session.milestoneId) {
      const rateLimitKey = `ussd:ratelimit:${session.actorId}:${session.milestoneId}`;
      const existing = await this.redis.get(rateLimitKey);
      if (existing) {
        return strings.alreadyAttested;
      }
    }

    // Generate OTP and send SMS
    const otp = await this.otpManager.generate(session.sessionId);
    const sent = await this.smsGateway.sendOtp(session.phoneNumber, otp);
    if (!sent) {
      return strings.smsFailed;
    }

    session.state = 'awaiting_otp';
    session.vote = '1';

    return strings.enterOtp;
  }

  private async handleVoteNon(session: UssdSession, strings: ReturnType<typeof getStrings>): Promise<string> {
    // Resolve phone → actor for audit log
    if (!session.actorId) {
      const actorId = await this.redis.get(`ussd:phone:${session.phoneNumber}`);
      if (actorId) {
        session.actorId = actorId;
        const actor = await this.actorsRepo.findById(actorId);
        if (actor) session.actorDid = actor.did;
      }
    }

    // Audit log negative response
    if (session.milestoneId) {
      await this.auditLog.log({
        entityType: 'UssdResponse',
        entityId: session.milestoneId,
        action: 'submit',
        actorDid: session.actorDid ?? 'anonymous',
        payload: {
          channel: 'ussd',
          vote: 'non',
          phoneNumber: session.phoneNumber,
          milestoneId: session.milestoneId,
        },
      });
    }

    return strings.thankYouNegative;
  }

  private handleVotePasSur(strings: ReturnType<typeof getStrings>): string {
    return strings.thankYouUnsure;
  }

  private async handleOtp(session: UssdSession, rawOtp: string, strings: ReturnType<typeof getStrings>): Promise<string> {
    const otp = sanitizeOtp(rawOtp);
    if (!otp) {
      return strings.invalidOtp;
    }

    const result = await this.otpManager.verify(session.sessionId, otp);

    if (result === 'expired') {
      return strings.expiredOtp;
    }
    if (result === 'invalid') {
      return strings.invalidOtp;
    }
    if (result === 'used') {
      return strings.usedOtp;
    }

    // Submit attestation
    if (!session.actorId || !session.actorDid || !session.milestoneId) {
      return strings.systemError;
    }

    const attestResult = await this.attestationsService.submitFromUssd(
      session.milestoneId,
      session.actorId,
      session.actorDid,
      session.phoneNumber,
    );

    if (!attestResult.ok) {
      const error = attestResult.error;
      if (error.message.includes('enrolled in the citizen pool')) {
        return strings.notEnrolled;
      }
      if (error.message.includes('already exists')) {
        return strings.alreadyAttested;
      }
      if (error.message.includes('auditor review is required') || error.message.includes('inspector verification is required')) {
        return strings.notReady;
      }
      return strings.systemError;
    }

    // Set rate limit
    const rateLimitKey = `ussd:ratelimit:${session.actorId}:${session.milestoneId}`;
    await this.redis.set(rateLimitKey, '1', 'EX', RATE_LIMIT_TTL);

    const refCode = `ATT-${attestResult.value.id.slice(0, 8).toUpperCase()}`;
    session.state = 'completed';

    return strings.attestationSuccess(refCode);
  }
}

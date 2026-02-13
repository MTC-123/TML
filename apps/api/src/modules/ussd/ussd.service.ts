import type { Result } from '../../lib/result.js';
import { ok, err } from '../../lib/result.js';
import { ValidationError } from '@tml/types';
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

const RATE_LIMIT_TTL = 86400; // 24 hours

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
      };
    }

    let response: string;

    try {
      response = await this.dispatch(session, parts);
    } catch {
      response = 'END Erreur système. Veuillez réessayer.';
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
    // Empty text → welcome
    if (parts.length === 1 && parts[0] === '') {
      return this.screenWelcome();
    }

    // Help
    if (parts.length === 1 && parts[0] === '2') {
      return this.screenHelp();
    }

    // Enter project code prompt
    if (parts.length === 1 && parts[0] === '1') {
      return this.screenEnterProjectCode(session);
    }

    // Project code entered
    if (parts.length === 2 && parts[0] === '1') {
      return this.handleProjectCode(session, parts[1]!);
    }

    // For steps 3+ we need project/milestone context resolved
    // AfricasTalking sends accumulated text, so session may already have this
    // from a previous callback, but we ensure it's populated.
    if (parts.length >= 3 && parts[0] === '1') {
      const ensured = await this.ensureProjectContext(session, parts[1]!);
      if (ensured) return ensured;
    }

    // Vote: Oui
    if (parts.length === 3 && parts[0] === '1' && parts[2] === '1') {
      return this.handleVoteOui(session);
    }

    // Vote: Non
    if (parts.length === 3 && parts[0] === '1' && parts[2] === '2') {
      return this.handleVoteNon(session);
    }

    // Vote: Pas sûr
    if (parts.length === 3 && parts[0] === '1' && parts[2] === '3') {
      return this.handleVotePasSur();
    }

    // OTP entered
    if (parts.length === 4 && parts[0] === '1' && parts[2] === '1') {
      return this.handleOtp(session, parts[3]!);
    }

    return 'END Entrée invalide. Veuillez réessayer.';
  }

  /** Ensure session has project/milestone context. Returns error string if resolution fails, null on success. */
  private async ensureProjectContext(session: UssdSession, rawCode: string): Promise<string | null> {
    if (session.projectId && session.milestoneId) return null;

    const code = sanitizeProjectCode(rawCode);
    if (!code) return 'END Code invalide. Le code doit contenir 6 chiffres.';

    const projectId = await this.projectCodeStore.resolve(code);
    if (!projectId) return 'END Projet non trouvé. Vérifiez le code et réessayez.';

    const project = await this.projectsRepo.findById(projectId);
    if (!project || project.deletedAt) return 'END Projet non trouvé. Vérifiez le code et réessayez.';

    const milestone = await this.milestonesRepo.findActiveByProjectId(projectId);
    if (!milestone) return 'END Aucune étape en cours pour ce projet.';

    session.projectId = projectId;
    session.projectName = project.name;
    session.milestoneId = milestone.id;
    session.milestoneDescription = milestone.description;
    return null;
  }

  private screenWelcome(): string {
    return 'CON Bienvenue sur TML\n1. Vérifier un projet\n2. Aide';
  }

  private screenHelp(): string {
    return 'END TML: plateforme de transparence. Appelez *123# pour vérifier les travaux publics.';
  }

  private screenEnterProjectCode(session: UssdSession): string {
    session.state = 'awaiting_project_code';
    return 'CON Entrez le code du projet (6 chiffres):';
  }

  private async handleProjectCode(session: UssdSession, rawCode: string): Promise<string> {
    const code = sanitizeProjectCode(rawCode);
    if (!code) {
      return 'END Code invalide. Le code doit contenir 6 chiffres.';
    }

    // Resolve project code → projectId
    const projectId = await this.projectCodeStore.resolve(code);
    if (!projectId) {
      return 'END Projet non trouvé. Vérifiez le code et réessayez.';
    }

    // Lookup project
    const project = await this.projectsRepo.findById(projectId);
    if (!project || project.deletedAt) {
      return 'END Projet non trouvé. Vérifiez le code et réessayez.';
    }

    // Find active milestone
    const milestone = await this.milestonesRepo.findActiveByProjectId(projectId);
    if (!milestone) {
      return 'END Aucune étape en cours pour ce projet.';
    }

    // Update session
    session.state = 'awaiting_vote';
    session.projectId = projectId;
    session.projectName = project.name;
    session.milestoneId = milestone.id;
    session.milestoneDescription = milestone.description;

    return `CON ${project.name}, Étape: ${milestone.description}\n1. Oui, travaux en cours\n2. Non, pas de progrès\n3. Pas sûr`;
  }

  private async handleVoteOui(session: UssdSession): Promise<string> {
    // Resolve phone → actor
    if (!session.actorId) {
      const actorId = await this.redis.get(`ussd:phone:${session.phoneNumber}`);
      if (!actorId) {
        return 'END Votre numéro n\'est pas enregistré. Veuillez vous inscrire d\'abord.';
      }
      const actor = await this.actorsRepo.findById(actorId);
      if (!actor) {
        return 'END Votre numéro n\'est pas enregistré. Veuillez vous inscrire d\'abord.';
      }
      session.actorId = actorId;
      session.actorDid = actor.did;
    }

    // Rate limit check
    if (session.actorId && session.milestoneId) {
      const rateLimitKey = `ussd:ratelimit:${session.actorId}:${session.milestoneId}`;
      const existing = await this.redis.get(rateLimitKey);
      if (existing) {
        return 'END Vous avez déjà attesté pour cette étape. Réessayez dans 24h.';
      }
    }

    // Generate OTP and send SMS
    const otp = await this.otpManager.generate(session.sessionId);
    const sent = await this.smsGateway.sendOtp(session.phoneNumber, otp);
    if (!sent) {
      return 'END Impossible d\'envoyer le SMS. Veuillez réessayer.';
    }

    session.state = 'awaiting_otp';
    session.vote = '1';

    return 'CON Entrez votre code de vérification (6 chiffres):';
  }

  private async handleVoteNon(session: UssdSession): Promise<string> {
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

    return 'END Merci pour votre réponse. Votre avis a été enregistré.';
  }

  private handleVotePasSur(): string {
    return 'END Merci. Vous pouvez réessayer plus tard.';
  }

  private async handleOtp(session: UssdSession, rawOtp: string): Promise<string> {
    const otp = sanitizeOtp(rawOtp);
    if (!otp) {
      return 'END Code incorrect. Veuillez réessayer.';
    }

    const result = await this.otpManager.verify(session.sessionId, otp);

    if (result === 'expired') {
      return 'END Code expiré. Veuillez réessayer.';
    }
    if (result === 'invalid') {
      return 'END Code incorrect. Veuillez réessayer.';
    }
    if (result === 'used') {
      return 'END Code déjà utilisé. Veuillez réessayer.';
    }

    // Submit attestation
    if (!session.actorId || !session.actorDid || !session.milestoneId) {
      return 'END Erreur de session. Veuillez réessayer.';
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
        return 'END Vous n\'êtes pas inscrit pour cette étape.';
      }
      if (error.message.includes('already exists')) {
        return 'END Vous avez déjà soumis une attestation pour cette étape.';
      }
      if (error.message.includes('auditor review is required') || error.message.includes('inspector verification is required')) {
        return 'END Cette étape n\'est pas encore prête pour les attestations citoyennes.';
      }
      return 'END Erreur lors de l\'enregistrement. Veuillez réessayer.';
    }

    // Set rate limit
    const rateLimitKey = `ussd:ratelimit:${session.actorId}:${session.milestoneId}`;
    await this.redis.set(rateLimitKey, '1', 'EX', RATE_LIMIT_TTL);

    const refCode = `ATT-${attestResult.value.id.slice(0, 8).toUpperCase()}`;
    session.state = 'completed';

    return `END Merci! Attestation enregistrée. Réf: ${refCode}`;
  }
}

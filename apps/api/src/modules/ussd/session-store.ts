export type UssdState = 'init' | 'awaiting_project_code' | 'awaiting_vote' | 'awaiting_otp' | 'completed';

export interface UssdSession {
  sessionId: string;
  phoneNumber: string;
  actorId: string | null;
  actorDid: string | null;
  state: UssdState;
  projectId: string | null;
  projectName: string | null;
  milestoneId: string | null;
  milestoneDescription: string | null;
  vote: string | null;
}

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
  del(key: string | string[]): Promise<number>;
}

const SESSION_TTL = 300; // 5 minutes

export class SessionStore {
  constructor(private redis: RedisClient) {}

  async load(sessionId: string): Promise<UssdSession | null> {
    const raw = await this.redis.get(`ussd:session:${sessionId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UssdSession;
    } catch {
      return null;
    }
  }

  async save(session: UssdSession): Promise<void> {
    await this.redis.set(
      `ussd:session:${session.sessionId}`,
      JSON.stringify(session),
      'EX',
      SESSION_TTL,
    );
  }

  async destroy(sessionId: string): Promise<void> {
    await this.redis.del(`ussd:session:${sessionId}`);
  }
}

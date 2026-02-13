import { sha256Hex } from '@tml/crypto';
import type { RedisClient } from './session-store.js';

export function deriveProjectCode(projectId: string): string {
  const hash = sha256Hex(projectId);
  const first8 = hash.slice(0, 8);
  const num = (parseInt(first8, 16) % 999999) + 1;
  return num.toString().padStart(6, '0');
}

export class ProjectCodeStore {
  constructor(private redis: RedisClient) {}

  async register(projectId: string): Promise<string> {
    const code = deriveProjectCode(projectId);
    await this.redis.set(`ussd:projectcode:${code}`, projectId);
    return code;
  }

  async resolve(code: string): Promise<string | null> {
    return this.redis.get(`ussd:projectcode:${code}`);
  }

  async ensureAllRegistered(projectIds: string[]): Promise<void> {
    for (const id of projectIds) {
      await this.register(id);
    }
  }
}

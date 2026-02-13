import { randomInt } from 'node:crypto';
import type { RedisClient } from './session-store.js';

const OTP_TTL = 180; // 3 minutes

export type OtpVerifyResult = 'valid' | 'expired' | 'invalid' | 'used';

export class OtpManager {
  constructor(private redis: RedisClient) {}

  async generate(sessionId: string): Promise<string> {
    const code = randomInt(100000, 999999).toString();
    await this.redis.set(`ussd:otp:${sessionId}`, code, 'EX', OTP_TTL);
    return code;
  }

  async verify(sessionId: string, candidate: string): Promise<OtpVerifyResult> {
    // Check if already used
    const usedFlag = await this.redis.get(`ussd:otp:used:${sessionId}`);
    if (usedFlag) return 'used';

    // Get stored OTP
    const stored = await this.redis.get(`ussd:otp:${sessionId}`);
    if (!stored) return 'expired';

    // Compare
    if (stored !== candidate) return 'invalid';

    // Mark as used and delete OTP
    await this.redis.set(`ussd:otp:used:${sessionId}`, '1', 'EX', OTP_TTL);
    await this.redis.del(`ussd:otp:${sessionId}`);

    return 'valid';
  }
}

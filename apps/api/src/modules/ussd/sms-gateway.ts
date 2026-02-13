export interface SmsGateway {
  sendOtp(to: string, code: string): Promise<boolean>;
}

export class AfricasTalkingSmsGateway implements SmsGateway {
  private url = 'https://api.africastalking.com/version1/messaging';

  constructor(
    private username: string,
    private apiKey: string,
  ) {}

  async sendOtp(to: string, code: string): Promise<boolean> {
    const message = `TML: Votre code de vérification est ${code}. Valide 3 minutes.`;

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': this.apiKey,
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          username: this.username,
          to,
          message,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

export class MockSmsGateway implements SmsGateway {
  sentMessages: Array<{ to: string; code: string }> = [];
  shouldFail = false;

  async sendOtp(to: string, code: string): Promise<boolean> {
    if (this.shouldFail) return false;
    this.sentMessages.push({ to, code });
    return true;
  }
}

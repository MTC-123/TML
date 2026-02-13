import { createHmac } from 'node:crypto';
import type { WebhookEventType } from '@tml/types';
import type { WebhooksRepository } from '../repositories/webhooks.repository.js';
import type { AuditLogService } from './audit-log.service.js';

const RETRY_DELAYS_MS = [1_000, 5_000, 25_000] as const;

export interface DeadLetterEntry {
  subscriptionId: string;
  eventType: string;
  body: string;
  failedAt: string;
  attempts: number;
}

export class WebhookDispatcherService {
  private deadLetters: DeadLetterEntry[] = [];

  constructor(
    private webhooksRepo: WebhooksRepository,
    private auditLogService: AuditLogService,
  ) {}

  async dispatch(eventType: WebhookEventType, payload: unknown): Promise<void> {
    const subscriptions = await this.webhooksRepo.findActiveByEventType(eventType);
    const body = JSON.stringify({ eventType, payload, timestamp: new Date().toISOString() });

    for (const sub of subscriptions) {
      this.deliverWithRetry(sub.url, sub.secretHash, body, sub.id, eventType).catch(
        () => {
          // Fire-and-forget: errors are logged inside deliverWithRetry
        },
      );
    }
  }

  getDeadLetters(): ReadonlyArray<DeadLetterEntry> {
    return [...this.deadLetters];
  }

  clearDeadLetters(): void {
    this.deadLetters = [];
  }

  private async deliverWithRetry(
    url: string,
    secretHash: string,
    body: string,
    subscriptionId: string,
    eventType: WebhookEventType,
  ): Promise<void> {
    const signature = createHmac('sha256', secretHash).update(body).digest('hex');

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-TML-Signature': signature,
            'X-TML-Event': eventType,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });

        if (response.ok) {
          await this.auditLogService.log({
            entityType: 'WebhookSubscription',
            entityId: subscriptionId,
            action: 'submit',
            actorDid: 'system',
            payload: { eventType, status: 'delivered', attempt: attempt + 1 },
          });
          return;
        }

        if (attempt < RETRY_DELAYS_MS.length) {
          await this.delay(RETRY_DELAYS_MS[attempt]!);
        }
      } catch {
        if (attempt < RETRY_DELAYS_MS.length) {
          await this.delay(RETRY_DELAYS_MS[attempt]!);
        }
      }
    }

    this.deadLetters.push({
      subscriptionId,
      eventType,
      body,
      failedAt: new Date().toISOString(),
      attempts: RETRY_DELAYS_MS.length + 1,
    });

    await this.auditLogService.log({
      entityType: 'WebhookSubscription',
      entityId: subscriptionId,
      action: 'submit',
      actorDid: 'system',
      payload: {
        eventType,
        status: 'failed',
        attempts: RETRY_DELAYS_MS.length + 1,
        deadLettered: true,
      },
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

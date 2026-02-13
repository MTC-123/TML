import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { WebhookDispatcherService } from './webhook-dispatcher.service.js';
import type { WebhookEventType } from '@tml/types';

function mockWebhooksRepo() {
  return {
    findActiveByEventType: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  };
}

function mockAuditLog() {
  return {
    log: vi.fn(),
    query: vi.fn(),
  };
}

function makeSub(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-1',
    url: 'https://example.com/webhook',
    eventTypes: ['dispute_opened'] as WebhookEventType[],
    secretHash: 'test-secret-hash',
    subscriberName: 'Test',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe('WebhookDispatcherService', () => {
  let service: WebhookDispatcherService;
  let webhooksRepo: ReturnType<typeof mockWebhooksRepo>;
  let auditLog: ReturnType<typeof mockAuditLog>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    webhooksRepo = mockWebhooksRepo();
    auditLog = mockAuditLog();
    service = new WebhookDispatcherService(webhooksRepo as any, auditLog as any);

    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('should find active subscriptions and send POST', async () => {
    const sub = makeSub();
    webhooksRepo.findActiveByEventType.mockResolvedValue([sub]);
    fetchMock.mockResolvedValue({ ok: true });

    await service.dispatch('dispute_opened', { test: true });

    // Allow the fire-and-forget promise to resolve
    await vi.runAllTimersAsync();

    expect(webhooksRepo.findActiveByEventType).toHaveBeenCalledWith('dispute_opened');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/webhook',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('should use HMAC-SHA256 for signature', async () => {
    const sub = makeSub({ secretHash: 'my-secret' });
    webhooksRepo.findActiveByEventType.mockResolvedValue([sub]);

    let capturedHeaders: Record<string, string> = {};
    let capturedBody = '';
    fetchMock.mockImplementation((_url: string, opts: RequestInit) => {
      capturedHeaders = Object.fromEntries(
        Object.entries(opts.headers as Record<string, string>),
      );
      capturedBody = opts.body as string;
      return Promise.resolve({ ok: true });
    });

    await service.dispatch('dispute_opened', { data: 1 });
    await vi.runAllTimersAsync();

    const expectedSig = createHmac('sha256', 'my-secret')
      .update(capturedBody)
      .digest('hex');
    expect(capturedHeaders['X-TML-Signature']).toBe(expectedSig);
  });

  it('should include X-TML-Signature and X-TML-Event headers', async () => {
    webhooksRepo.findActiveByEventType.mockResolvedValue([makeSub()]);
    fetchMock.mockResolvedValue({ ok: true });

    await service.dispatch('dispute_opened', {});
    await vi.runAllTimersAsync();

    const callArgs = fetchMock.mock.calls[0][1];
    expect(callArgs.headers).toHaveProperty('X-TML-Signature');
    expect(callArgs.headers).toHaveProperty('X-TML-Event', 'dispute_opened');
  });

  it('should retry on HTTP error response', async () => {
    webhooksRepo.findActiveByEventType.mockResolvedValue([makeSub()]);
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: false, status: 500 });

    await service.dispatch('dispute_opened', {});
    await vi.runAllTimersAsync();

    // 1 initial + 3 retries = 4 attempts
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('should retry on network error', async () => {
    webhooksRepo.findActiveByEventType.mockResolvedValue([makeSub()]);
    fetchMock
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true });

    await service.dispatch('dispute_opened', {});
    await vi.runAllTimersAsync();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should log delivered on success', async () => {
    webhooksRepo.findActiveByEventType.mockResolvedValue([makeSub()]);
    fetchMock.mockResolvedValue({ ok: true });

    await service.dispatch('dispute_opened', {});
    await vi.runAllTimersAsync();

    expect(auditLog.log).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({ status: 'delivered' }),
    }));
  });

  it('should not retry after success', async () => {
    webhooksRepo.findActiveByEventType.mockResolvedValue([makeSub()]);
    fetchMock.mockResolvedValue({ ok: true });

    await service.dispatch('dispute_opened', {});
    await vi.runAllTimersAsync();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should add dead letter entry after all retries fail', async () => {
    webhooksRepo.findActiveByEventType.mockResolvedValue([makeSub()]);
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    await service.dispatch('dispute_opened', {});
    await vi.runAllTimersAsync();

    const deadLetters = service.getDeadLetters();
    expect(deadLetters).toHaveLength(1);
    expect(deadLetters[0]).toEqual(expect.objectContaining({
      subscriptionId: 'sub-1',
      eventType: 'dispute_opened',
      attempts: 4,
    }));
  });

  it('should log failure with deadLettered flag', async () => {
    webhooksRepo.findActiveByEventType.mockResolvedValue([makeSub()]);
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    await service.dispatch('dispute_opened', {});
    await vi.runAllTimersAsync();

    expect(auditLog.log).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({
        status: 'failed',
        deadLettered: true,
      }),
    }));
  });

  it('should clear dead letters', async () => {
    webhooksRepo.findActiveByEventType.mockResolvedValue([makeSub()]);
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    await service.dispatch('dispute_opened', {});
    await vi.runAllTimersAsync();

    expect(service.getDeadLetters()).toHaveLength(1);
    service.clearDeadLetters();
    expect(service.getDeadLetters()).toHaveLength(0);
  });

  it('should not make fetch calls when no active subscriptions', async () => {
    webhooksRepo.findActiveByEventType.mockResolvedValue([]);

    await service.dispatch('dispute_opened', {});
    await vi.runAllTimersAsync();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should dispatch to multiple subscriptions', async () => {
    const sub1 = makeSub({ id: 'sub-1', url: 'https://a.com/hook' });
    const sub2 = makeSub({ id: 'sub-2', url: 'https://b.com/hook' });
    webhooksRepo.findActiveByEventType.mockResolvedValue([sub1, sub2]);
    fetchMock.mockResolvedValue({ ok: true });

    await service.dispatch('dispute_opened', {});
    await vi.runAllTimersAsync();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should include correct body format with eventType, payload, timestamp', async () => {
    webhooksRepo.findActiveByEventType.mockResolvedValue([makeSub()]);
    fetchMock.mockResolvedValue({ ok: true });

    await service.dispatch('dispute_opened', { id: '123' });
    await vi.runAllTimersAsync();

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toHaveProperty('eventType', 'dispute_opened');
    expect(body).toHaveProperty('payload', { id: '123' });
    expect(body).toHaveProperty('timestamp');
  });
});

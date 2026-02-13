import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhooksService } from './webhooks.service.js';

function mockRepo() {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    findActiveByEventType: vi.fn(),
  };
}

function mockAuditLog() {
  return {
    log: vi.fn(),
    query: vi.fn(),
  };
}

function makeWebhook(overrides: Record<string, unknown> = {}) {
  return {
    id: 'wh-1',
    url: 'https://example.com/webhook',
    eventTypes: ['dispute_opened'],
    secretHash: 'hashed-secret',
    subscriberName: 'Test Subscriber',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

const ACTOR_DID = 'did:key:z6MkTest';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let repo: ReturnType<typeof mockRepo>;
  let auditLog: ReturnType<typeof mockAuditLog>;

  beforeEach(() => {
    repo = mockRepo();
    auditLog = mockAuditLog();
    service = new WebhooksService(repo as any, auditLog as any);
  });

  // ── Create ──────────────────────────────────────────────────────────────

  describe('create()', () => {
    const input = {
      url: 'https://example.com/webhook',
      eventTypes: ['dispute_opened'],
      secret: 'super-secret-key-1234',
      subscriberName: 'Test',
    };

    it('should hash the secret and create subscription', async () => {
      repo.create.mockResolvedValue(makeWebhook());

      const result = await service.create(input, ACTOR_DID);

      expect(result.ok).toBe(true);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        url: 'https://example.com/webhook',
        subscriberName: 'Test',
        secretHash: expect.any(String),
      }));
      // Secret hash should NOT be the raw secret
      const callArg = repo.create.mock.calls[0][0];
      expect(callArg.secretHash).not.toBe('super-secret-key-1234');
    });

    it('should log audit entry on create', async () => {
      repo.create.mockResolvedValue(makeWebhook());

      await service.create(input, ACTOR_DID);

      expect(auditLog.log).toHaveBeenCalledWith(expect.objectContaining({
        entityType: 'WebhookSubscription',
        action: 'create',
        actorDid: ACTOR_DID,
      }));
    });
  });

  // ── List ────────────────────────────────────────────────────────────────

  describe('list()', () => {
    it('should return paginated results', async () => {
      const webhooks = [makeWebhook(), makeWebhook({ id: 'wh-2' })];
      repo.findAll.mockResolvedValue({ data: webhooks, total: 2 });

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toHaveLength(2);
        expect(result.value.pagination).toEqual({ page: 1, limit: 10, total: 2 });
      }
    });
  });

  // ── Get by ID ───────────────────────────────────────────────────────────

  describe('getById()', () => {
    it('should return webhook when found', async () => {
      repo.findById.mockResolvedValue(makeWebhook());

      const result = await service.getById('wh-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('wh-1');
      }
    });

    it('should return error when not found', async () => {
      repo.findById.mockResolvedValue(null);

      const result = await service.getById('wh-missing');

      expect(result.ok).toBe(false);
    });

    it('should return error when soft-deleted', async () => {
      repo.findById.mockResolvedValue(makeWebhook({ deletedAt: new Date() }));

      const result = await service.getById('wh-1');

      expect(result.ok).toBe(false);
    });
  });

  // ── Update ──────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('should update webhook fields', async () => {
      const existing = makeWebhook();
      const updated = makeWebhook({ url: 'https://new.com/hook' });
      repo.findById.mockResolvedValue(existing);
      repo.update.mockResolvedValue(updated);

      const result = await service.update('wh-1', { url: 'https://new.com/hook' }, ACTOR_DID);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.url).toBe('https://new.com/hook');
      }
    });

    it('should log audit entry on update', async () => {
      repo.findById.mockResolvedValue(makeWebhook());
      repo.update.mockResolvedValue(makeWebhook());

      await service.update('wh-1', { active: false }, ACTOR_DID);

      expect(auditLog.log).toHaveBeenCalledWith(expect.objectContaining({
        entityType: 'WebhookSubscription',
        action: 'update',
        actorDid: ACTOR_DID,
      }));
    });

    it('should return error when webhook not found', async () => {
      repo.findById.mockResolvedValue(null);

      const result = await service.update('wh-missing', { url: 'https://new.com' }, ACTOR_DID);

      expect(result.ok).toBe(false);
    });

    it('should return error when webhook is soft-deleted', async () => {
      repo.findById.mockResolvedValue(makeWebhook({ deletedAt: new Date() }));

      const result = await service.update('wh-1', { url: 'https://new.com' }, ACTOR_DID);

      expect(result.ok).toBe(false);
    });
  });

  // ── Remove ──────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('should soft delete webhook', async () => {
      repo.findById.mockResolvedValue(makeWebhook());
      repo.softDelete.mockResolvedValue(makeWebhook({ deletedAt: new Date() }));

      const result = await service.remove('wh-1', ACTOR_DID);

      expect(result.ok).toBe(true);
      expect(repo.softDelete).toHaveBeenCalledWith('wh-1');
    });

    it('should log audit entry on remove', async () => {
      repo.findById.mockResolvedValue(makeWebhook());
      repo.softDelete.mockResolvedValue(makeWebhook({ deletedAt: new Date() }));

      await service.remove('wh-1', ACTOR_DID);

      expect(auditLog.log).toHaveBeenCalledWith(expect.objectContaining({
        entityType: 'WebhookSubscription',
        action: 'delete',
        actorDid: ACTOR_DID,
      }));
    });

    it('should return error when webhook not found', async () => {
      repo.findById.mockResolvedValue(null);

      const result = await service.remove('wh-missing', ACTOR_DID);

      expect(result.ok).toBe(false);
    });

    it('should return error when already soft-deleted', async () => {
      repo.findById.mockResolvedValue(makeWebhook({ deletedAt: new Date() }));

      const result = await service.remove('wh-1', ACTOR_DID);

      expect(result.ok).toBe(false);
    });
  });
});

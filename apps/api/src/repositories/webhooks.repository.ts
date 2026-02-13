import type { PrismaClient, Prisma } from '@prisma/client';
import type { WebhookSubscription, WebhookEventType } from '@tml/types';

export class WebhooksRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(params: {
    page: number;
    limit: number;
  }): Promise<{ data: WebhookSubscription[]; total: number }> {
    const where: Prisma.WebhookSubscriptionWhereInput = { deletedAt: null };

    const [data, total] = await Promise.all([
      this.prisma.webhookSubscription.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.webhookSubscription.count({ where }),
    ]);

    return { data: data.map((w) => this.toEntity(w)), total };
  }

  async findById(id: string): Promise<WebhookSubscription | null> {
    const webhook = await this.prisma.webhookSubscription.findUnique({ where: { id } });
    return webhook ? this.toEntity(webhook) : null;
  }

  async create(data: {
    url: string;
    eventTypes: WebhookEventType[];
    secretHash: string;
    subscriberName: string;
  }): Promise<WebhookSubscription> {
    const webhook = await this.prisma.webhookSubscription.create({
      data: {
        url: data.url,
        eventTypes: data.eventTypes,
        secretHash: data.secretHash,
        subscriberName: data.subscriberName,
      },
    });
    return this.toEntity(webhook);
  }

  async update(
    id: string,
    data: Partial<{ url: string; eventTypes: WebhookEventType[]; active: boolean }>,
  ): Promise<WebhookSubscription> {
    const updateData: Prisma.WebhookSubscriptionUpdateInput = {};
    if (data.url !== undefined) updateData.url = data.url;
    if (data.eventTypes !== undefined) updateData.eventTypes = data.eventTypes;
    if (data.active !== undefined) updateData.active = data.active;

    const webhook = await this.prisma.webhookSubscription.update({
      where: { id },
      data: updateData,
    });
    return this.toEntity(webhook);
  }

  async softDelete(id: string): Promise<WebhookSubscription> {
    const webhook = await this.prisma.webhookSubscription.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    });
    return this.toEntity(webhook);
  }

  async findActiveByEventType(eventType: WebhookEventType): Promise<WebhookSubscription[]> {
    const webhooks = await this.prisma.webhookSubscription.findMany({
      where: {
        active: true,
        deletedAt: null,
        eventTypes: { has: eventType },
      },
    });
    return webhooks.map((w) => this.toEntity(w));
  }

  private toEntity(raw: {
    id: string;
    url: string;
    eventTypes: string[];
    secretHash: string;
    subscriberName: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): WebhookSubscription {
    return {
      id: raw.id,
      url: raw.url,
      eventTypes: raw.eventTypes as WebhookEventType[],
      secretHash: raw.secretHash,
      subscriberName: raw.subscriberName,
      active: raw.active,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    };
  }
}

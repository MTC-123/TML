import type { PrismaClient } from '@prisma/client';
import type { AgentConnection } from '@tml/types';

export class AgentConnectionsRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    initiatorDid: string;
    responderDid?: string;
    state?: string;
    label?: string;
  }): Promise<AgentConnection> {
    const record = await this.prisma.agentConnection.create({
      data: {
        initiatorDid: data.initiatorDid,
        responderDid: data.responderDid ?? null,
        state: (data.state as 'invited' | 'connected' | 'active' | 'closed') ?? 'invited',
        label: data.label ?? null,
      },
    });
    return this.toEntity(record);
  }

  async findById(id: string): Promise<AgentConnection | null> {
    const record = await this.prisma.agentConnection.findUnique({ where: { id } });
    return record ? this.toEntity(record) : null;
  }

  async findByDid(did: string): Promise<AgentConnection[]> {
    const records = await this.prisma.agentConnection.findMany({
      where: {
        OR: [{ initiatorDid: did }, { responderDid: did }],
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toEntity(r));
  }

  async updateState(id: string, state: string, responderDid?: string): Promise<AgentConnection> {
    const updateData: Record<string, unknown> = {
      state: state as 'invited' | 'connected' | 'active' | 'closed',
    };
    if (responderDid) {
      updateData['responderDid'] = responderDid;
    }
    const record = await this.prisma.agentConnection.update({
      where: { id },
      data: updateData,
    });
    return this.toEntity(record);
  }

  private toEntity(raw: {
    id: string;
    initiatorDid: string;
    responderDid: string | null;
    state: string;
    label: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): AgentConnection {
    return {
      id: raw.id,
      initiatorDid: raw.initiatorDid,
      responderDid: raw.responderDid,
      state: raw.state as AgentConnection['state'],
      label: raw.label,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}

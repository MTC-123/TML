import type { PrismaClient } from '@prisma/client';
import type { Actor, ActorRole } from '@tml/types';

export class ActorsRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Actor | null> {
    const actor = await this.prisma.actor.findUnique({ where: { id } });
    return actor ? this.toEntity(actor) : null;
  }

  async findByDid(did: string): Promise<Actor | null> {
    const actor = await this.prisma.actor.findUnique({ where: { did } });
    return actor ? this.toEntity(actor) : null;
  }

  async findByCnieHash(cnieHash: string): Promise<Actor | null> {
    const actor = await this.prisma.actor.findUnique({ where: { cnieHash } });
    return actor ? this.toEntity(actor) : null;
  }

  async create(data: { did: string; cnieHash: string; roles: ActorRole[] }): Promise<Actor> {
    const actor = await this.prisma.actor.create({ data });
    return this.toEntity(actor);
  }

  async update(id: string, data: Partial<{ roles: ActorRole[] }>): Promise<Actor> {
    const actor = await this.prisma.actor.update({ where: { id }, data });
    return this.toEntity(actor);
  }

  async findByRole(role: ActorRole): Promise<Actor[]> {
    const actors = await this.prisma.actor.findMany({
      where: { roles: { has: role } },
    });
    return actors.map((a) => this.toEntity(a));
  }

  private toEntity(raw: {
    id: string;
    did: string;
    cnieHash: string;
    roles: string[];
    createdAt: Date;
    updatedAt: Date;
  }): Actor {
    return {
      id: raw.id,
      did: raw.did,
      cnieHash: raw.cnieHash,
      roles: raw.roles as ActorRole[],
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}

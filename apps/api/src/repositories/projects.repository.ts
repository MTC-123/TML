import type { PrismaClient, Prisma } from '@prisma/client';
import type { Project, ProjectStatus, GeoPoint, CreateProjectInput, UpdateProjectInput } from '@tml/types';

export class ProjectsRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
    region?: string;
  }): Promise<{ data: Project[]; total: number }> {
    const where: Prisma.ProjectWhereInput = { deletedAt: null };
    if (params.status) {
      where.status = params.status as ProjectStatus;
    }
    if (params.region) {
      where.region = params.region;
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    return { data: data.map((p) => this.toEntity(p)), total };
  }

  async findById(id: string): Promise<Project | null> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    return project ? this.toEntity(project) : null;
  }

  async create(data: CreateProjectInput): Promise<Project> {
    const project = await this.prisma.project.create({
      data: {
        name: data.name,
        region: data.region,
        budget: data.budget,
        donor: data.donor ?? null,
        boundary: data.boundary ? (data.boundary as unknown as Prisma.InputJsonValue) : undefined,
      },
    });
    return this.toEntity(project);
  }

  async update(id: string, data: UpdateProjectInput): Promise<Project> {
    const updateData: Prisma.ProjectUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.region !== undefined) updateData.region = data.region;
    if (data.budget !== undefined) updateData.budget = data.budget;
    if (data.donor !== undefined) updateData.donor = data.donor;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.boundary !== undefined) {
      updateData.boundary = data.boundary as unknown as Prisma.InputJsonValue;
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: updateData,
    });
    return this.toEntity(project);
  }

  async softDelete(id: string): Promise<Project> {
    const project = await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return this.toEntity(project);
  }

  async getStats(): Promise<{
    byStatus: Record<string, number>;
    totalBudget: string;
    totalProjects: number;
    byRegion: Record<string, number>;
  }> {
    const [byStatusRaw, budgetAgg, byRegionRaw] = await Promise.all([
      this.prisma.project.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { deletedAt: null },
      }),
      this.prisma.project.aggregate({
        _sum: { budget: true },
        _count: { id: true },
        where: { deletedAt: null },
      }),
      this.prisma.project.groupBy({
        by: ['region'],
        _count: { id: true },
        where: { deletedAt: null },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const row of byStatusRaw) {
      byStatus[row.status] = row._count.id;
    }

    const byRegion: Record<string, number> = {};
    for (const row of byRegionRaw) {
      byRegion[row.region] = row._count.id;
    }

    return {
      byStatus,
      totalBudget: budgetAgg._sum.budget?.toString() ?? '0',
      totalProjects: budgetAgg._count.id,
      byRegion,
    };
  }

  async findByNameAndRegion(name: string, region: string): Promise<Project | null> {
    const project = await this.prisma.project.findFirst({
      where: { name, region, deletedAt: null },
    });
    return project ? this.toEntity(project) : null;
  }

  private toEntity(raw: {
    id: string;
    name: string;
    region: string;
    budget: Prisma.Decimal;
    donor: string | null;
    status: string;
    boundary: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Project {
    return {
      id: raw.id,
      name: raw.name,
      region: raw.region,
      budget: raw.budget.toString(),
      donor: raw.donor,
      status: raw.status as ProjectStatus,
      boundary: raw.boundary as GeoPoint[] | null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    };
  }
}

import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import type { Project } from '@tml/types';
import { NotFoundError, ConflictError } from '@tml/types';
import type { ProjectsRepository } from '../repositories/projects.repository.js';
import type { AuditLogService } from './audit-log.service.js';

export class ProjectsService {
  constructor(
    private repo: ProjectsRepository,
    private auditLog: AuditLogService,
  ) {}

  async list(params: {
    page: number;
    limit: number;
    status?: string;
    region?: string;
  }): Promise<Result<{ data: Project[]; pagination: { page: number; limit: number; total: number } }>> {
    const { data, total } = await this.repo.findAll(params);
    return ok({ data, pagination: { page: params.page, limit: params.limit, total } });
  }

  async create(
    data: { name: string; region: string; budget: string; donor?: string; boundary?: { lat: number; lng: number }[] },
    actorDid: string,
  ): Promise<Result<Project>> {
    // Check for duplicate name + region
    const existing = await this.repo.findByNameAndRegion(data.name, data.region);
    if (existing) {
      return err(new ConflictError(
        `Project '${data.name}' already exists in region '${data.region}'`,
        { name: data.name, region: data.region },
      ));
    }

    const project = await this.repo.create(data);

    await this.auditLog.log({
      entityType: 'Project',
      entityId: project.id,
      action: 'create',
      actorDid,
      payload: data,
    });

    return ok(project);
  }

  async getById(id: string): Promise<Result<Project>> {
    const project = await this.repo.findById(id);
    if (!project || project.deletedAt) {
      return err(new NotFoundError('Project', id));
    }
    return ok(project);
  }

  async update(
    id: string,
    data: import('@tml/types').UpdateProjectInput,
    actorDid: string,
  ): Promise<Result<Project>> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.deletedAt) {
      return err(new NotFoundError('Project', id));
    }

    const project = await this.repo.update(id, data);

    await this.auditLog.log({
      entityType: 'Project',
      entityId: id,
      action: 'update',
      actorDid,
      payload: data,
    });

    return ok(project);
  }

  async remove(id: string, actorDid: string): Promise<Result<void>> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.deletedAt) {
      return err(new NotFoundError('Project', id));
    }

    await this.repo.softDelete(id);

    await this.auditLog.log({
      entityType: 'Project',
      entityId: id,
      action: 'delete',
      actorDid,
      payload: {},
    });

    return ok(undefined);
  }

  async getStats(): Promise<Result<{
    byStatus: Record<string, number>;
    totalBudget: string;
    totalProjects: number;
    byRegion: Record<string, number>;
  }>> {
    const stats = await this.repo.getStats();
    return ok(stats);
  }
}

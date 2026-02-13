import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { auditLogQuerySchema } from '@tml/types';
import { AuditLogService } from '../services/audit-log.service.js';
import { AuditLogsRepository } from '../repositories/audit-logs.repository.js';

export class AuditLogsController {
  private service: AuditLogService;

  constructor(fastify: FastifyInstance) {
    const repo = new AuditLogsRepository(fastify.prisma);
    this.service = new AuditLogService(repo);
  }

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = request.query as z.infer<typeof auditLogQuerySchema>;
    const result = await this.service.query(query);

    if (!result.ok) {
      throw result.error;
    }

    const { data, total } = result.value;
    reply.send({
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
      },
    });
  }
}

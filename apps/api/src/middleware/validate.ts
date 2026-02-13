import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ZodSchema } from 'zod';
import { ValidationError } from '@tml/types';

export function validateBody(
  schema: ZodSchema,
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      const details = result.error.flatten();
      throw new ValidationError('Request body validation failed', {
        fieldErrors: details.fieldErrors,
        formErrors: details.formErrors,
      });
    }
    request.body = result.data;
  };
}

export function validateParams(
  schema: ZodSchema,
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const result = schema.safeParse(request.params);
    if (!result.success) {
      const details = result.error.flatten();
      throw new ValidationError('Request params validation failed', {
        fieldErrors: details.fieldErrors,
        formErrors: details.formErrors,
      });
    }
    (request as FastifyRequest & { params: unknown }).params = result.data;
  };
}

export function validateQuery(
  schema: ZodSchema,
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const result = schema.safeParse(request.query);
    if (!result.success) {
      const details = result.error.flatten();
      throw new ValidationError('Request query validation failed', {
        fieldErrors: details.fieldErrors,
        formErrors: details.formErrors,
      });
    }
    (request as FastifyRequest & { query: unknown }).query = result.data;
  };
}

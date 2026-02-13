import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
  ConflictError,
  QuorumNotMetError,
} from '@tml/types';
import {
  InvalidSignatureError,
  ExpiredCredentialError,
  TamperedDataError,
  MalformedDIDError,
  CryptoError,
} from '@tml/crypto';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const response: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };

  let statusCode = 500;

  // @tml/types errors
  if (error instanceof ValidationError) {
    statusCode = 400;
    response.error = {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  } else if (error instanceof AuthorizationError) {
    statusCode = 403;
    response.error = {
      code: error.code,
      message: error.message,
    };
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    response.error = {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  } else if (error instanceof ConflictError) {
    statusCode = 409;
    response.error = {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  } else if (error instanceof QuorumNotMetError) {
    statusCode = 422;
    response.error = {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }
  // @tml/crypto errors
  else if (
    error instanceof InvalidSignatureError ||
    error instanceof MalformedDIDError ||
    error instanceof TamperedDataError ||
    error instanceof ExpiredCredentialError
  ) {
    statusCode = 400;
    response.error = {
      code: (error as CryptoError).code,
      message: error.message,
      details: (error as CryptoError).details,
    };
  }
  // Rate limit errors
  else if (
    'code' in error &&
    (error as FastifyError).code === 'RATE_LIMIT_EXCEEDED'
  ) {
    statusCode = 429;
    response.error = {
      code: 'RATE_LIMIT_EXCEEDED',
      message: error.message,
    };
  }
  // Fastify JWT errors (unauthorized)
  else if (
    'statusCode' in error &&
    (error as FastifyError).statusCode === 401
  ) {
    statusCode = 401;
    response.error = {
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    };
  }
  // Fallback: never leak internal error messages
  else {
    request.log.error(error, 'Unhandled error');
    statusCode = 500;
    response.error = {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    };
  }

  reply.status(statusCode).send(response);
}

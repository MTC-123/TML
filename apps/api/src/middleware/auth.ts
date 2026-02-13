import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ActorRole } from '@tml/types';
import { AuthorizationError } from '@tml/types';
import type { JwtPayload, ActorContext } from '../lib/types.js';

/**
 * JWT verification preHandler.
 *
 * Decodes the JWT, extracts identity claims (DID, roles from VC claims,
 * actor ID), and enriches the request context with an `actor` object
 * available to downstream handlers.
 */
export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const decoded = await request.jwtVerify<JwtPayload>();

  // Build the actor context from verified JWT claims.
  // The JWT `roles` field is populated at token issuance from the actor's
  // Verifiable Credential claims (role assertions bound to their DID).
  const actor: ActorContext = {
    did: decoded.did,
    roles: decoded.roles,
    actorId: decoded.actorId,
  };

  // Enrich request so all downstream handlers have identity context.
  request.actor = actor;

  // Propagate the DID into the pino logger for structured correlation.
  request.log = request.log.child({ did: actor.did, actorId: actor.actorId });
}

/**
 * Role-based access control guard factory.
 *
 * Returns a preHandler that checks the authenticated actor has at least
 * one of the required roles (extracted from their VC claims at login).
 * Must be registered **after** `authenticate`.
 *
 * @example
 * fastify.get('/admin', {
 *   preHandler: [authenticate, requireRole('admin')],
 * }, handler);
 */
export function requireRole(
  ...roles: ActorRole[]
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const actorRoles = request.actor?.roles;
    if (!actorRoles) {
      throw new AuthorizationError('Authentication required');
    }

    const hasRole = roles.some((role) => actorRoles.includes(role));
    if (!hasRole) {
      throw new AuthorizationError(
        `Requires one of roles: ${roles.join(', ')}`,
      );
    }
  };
}

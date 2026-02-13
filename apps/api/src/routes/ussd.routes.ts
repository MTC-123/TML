import type { FastifyInstance } from 'fastify';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateBody } from '../middleware/validate.js';
import { UssdController, ussdCallbackSchema } from '../controllers/ussd.controller.js';
import { ValidationError } from '@tml/types';

export async function ussdRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const controller = new UssdController(fastify);

  // POST /callback - USSD callback from Africa's Talking
  fastify.post(
    '/callback',
    {
      preHandler: [
        // API key validation for USSD gateway
        async (request, _reply) => {
          const apiKey = request.headers['x-api-key'];
          const expectedKey = process.env['AFRICASTALKING_API_KEY'];
          if (!expectedKey || apiKey !== expectedKey) {
            throw new ValidationError('Invalid API key');
          }
        },
        rateLimit('strict'),
        validateBody(ussdCallbackSchema),
      ],
    },
    (request, reply) => controller.callback(request, reply),
  );
}

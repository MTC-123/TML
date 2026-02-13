import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { createPrismaClient, disconnectPrisma } from '../lib/prisma.js';
import { loadEnv } from '../config.js';

async function prismaPlugin(fastify: FastifyInstance): Promise<void> {
  const env = loadEnv();
  const prisma = createPrismaClient(env);

  await prisma.$connect();

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await disconnectPrisma();
  });
}

export default fp(prismaPlugin, {
  name: 'prisma',
  fastify: '5.x',
});

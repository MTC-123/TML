import { buildApp } from './app.js';
import { loadEnv } from './config.js';

async function start(): Promise<void> {
  const env = loadEnv();
  const app = await buildApp();

  // ── Graceful shutdown ───────────────────────────────────────────────────
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, () => {
      app.log.info(`Received ${signal}, shutting down gracefully…`);
      app.close().then(
        () => {
          app.log.info('Server closed');
          process.exit(0);
        },
        (err) => {
          app.log.error(err, 'Error during shutdown');
          process.exit(1);
        },
      );
    });
  }

  await app.listen({ port: env.PORT, host: env.HOST });
  app.log.info(`Server listening on http://${env.HOST}:${env.PORT}`);
  app.log.info(`Swagger UI: http://${env.HOST}:${env.PORT}/documentation`);
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

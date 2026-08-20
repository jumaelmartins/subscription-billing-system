import { buildApp } from './app';
import { env } from './config/env';
import { sql } from './shared/database/pool';
import { closeBroker, getBrokerConnection } from './shared/messaging/connection';

async function main(): Promise<void> {
  getBrokerConnection();
  const app = await buildApp();

  await app.listen({ host: env.API_HOST, port: env.API_PORT });

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, 'shutting down');
    try {
      await app.close();
      await closeBroker();
      await sql.end({ timeout: 5 });
    } finally {
      process.exit(0);
    }
  };

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => void shutdown(signal));
  }
}

main().catch((err) => {
  console.error('fatal: failed to start api', err);
  process.exit(1);
});

import { closeConnection, getConnection } from './broker';
import { startNotificationsConsumer } from './consumers/notifications.consumer';
import { startWebhooksConsumer } from './consumers/webhooks.consumer';
import { logger } from './logger';

async function main(): Promise<void> {
  const connection = getConnection();
  const notifications = startNotificationsConsumer(connection);
  const webhooks = startWebhooksConsumer(connection);
  await Promise.all([notifications.waitForConnect(), webhooks.waitForConnect()]);
  logger.info('worker ready');

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutting down');
    try {
      await Promise.all([notifications.close(), webhooks.close()]);
      await closeConnection();
    } finally {
      process.exit(0);
    }
  };

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => void shutdown(signal));
  }
}

main().catch((err) => {
  logger.error({ err }, 'fatal: worker failed to start');
  process.exit(1);
});

import amqp from 'amqp-connection-manager';
import { EXCHANGE, EXCHANGE_TYPE, Queues } from '@sbs/contracts';
import { env } from './config/env';
import { logger } from './logger';

/**
 * Fase 0 skeleton: connect to the broker and assert the core topology
 * (topic exchange + dead-letter queue). Consumers and handlers are added in the
 * RabbitMQ/workers phase.
 */
async function main(): Promise<void> {
  const connection = amqp.connect([env.RABBITMQ_URL], { heartbeatIntervalInSeconds: 15 });
  connection.on('connect', () => logger.info('rabbitmq connected'));
  connection.on('disconnect', ({ err }) => logger.warn({ err: err?.message }, 'rabbitmq disconnected'));

  const channelWrapper = connection.createChannel({
    json: true,
    setup: async (channel: import('amqplib').ConfirmChannel) => {
      await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
      await channel.assertQueue(Queues.DeadLetter, { durable: true });
      logger.info({ exchange: EXCHANGE, deadLetter: Queues.DeadLetter }, 'topology asserted');
    },
  });

  await channelWrapper.waitForConnect();
  logger.info('worker ready');

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutting down');
    try {
      await channelWrapper.close();
      await connection.close();
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

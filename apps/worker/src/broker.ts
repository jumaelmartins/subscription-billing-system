import amqp, { type AmqpConnectionManager } from 'amqp-connection-manager';
import { env } from './config/env';
import { logger } from './logger';

let connection: AmqpConnectionManager | null = null;

export function getConnection(): AmqpConnectionManager {
  if (!connection) {
    connection = amqp.connect([env.RABBITMQ_URL], { heartbeatIntervalInSeconds: 15 });
    connection.on('connect', () => logger.info('rabbitmq connected'));
    connection.on('disconnect', ({ err }) => logger.warn({ err: err?.message }, 'rabbitmq disconnected'));
  }
  return connection;
}

export async function closeConnection(): Promise<void> {
  if (connection) {
    await connection.close();
    connection = null;
  }
}

import amqp, { type AmqpConnectionManager } from 'amqp-connection-manager';
import { env } from '../../config/env';
import { logger } from '../logger';

let connection: AmqpConnectionManager | null = null;

/**
 * Returns the singleton broker connection, creating (and starting to connect) it
 * on first call. `amqp-connection-manager` handles reconnection transparently.
 */
export function getBrokerConnection(): AmqpConnectionManager {
  if (!connection) {
    connection = amqp.connect([env.RABBITMQ_URL], { heartbeatIntervalInSeconds: 15 });
    connection.on('connect', () => logger.info('rabbitmq connected'));
    connection.on('disconnect', ({ err }) => logger.warn({ err: err?.message }, 'rabbitmq disconnected'));
  }
  return connection;
}

export function isBrokerConnected(): boolean {
  return connection?.isConnected() ?? false;
}

export async function closeBroker(): Promise<void> {
  if (connection) {
    await connection.close();
    connection = null;
  }
}

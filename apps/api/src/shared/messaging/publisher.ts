import { randomUUID } from 'node:crypto';
import type { ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';
import { EXCHANGE, EXCHANGE_TYPE, type EventEnvelope, type RoutingKey } from '@sbs/contracts';
import { logger } from '../logger';
import { getBrokerConnection } from './connection';

let channel: ChannelWrapper | null = null;

function getPublishChannel(): ChannelWrapper {
  if (!channel) {
    channel = getBrokerConnection().createChannel({
      json: true,
      setup: async (ch: ConfirmChannel) => {
        await ch.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
      },
    });
  }
  return channel;
}

/**
 * Publishes a domain event to the topic exchange. Best-effort: publishing runs
 * after the domain transaction has committed, so a broker hiccup is logged but
 * never fails the HTTP response.
 */
export async function publishEvent<T>(
  routingKey: RoutingKey,
  payload: T,
  opts: { correlationId?: string; requestId?: string } = {},
): Promise<void> {
  const envelope: EventEnvelope<T> = {
    eventId: randomUUID(),
    routingKey,
    occurredAt: new Date().toISOString(),
    correlationId: opts.correlationId ?? randomUUID(),
    requestId: opts.requestId,
    payload,
  };
  try {
    await getPublishChannel().publish(EXCHANGE, routingKey, envelope, {
      persistent: true,
      contentType: 'application/json',
      messageId: envelope.eventId,
      correlationId: envelope.correlationId,
    });
  } catch (err) {
    logger.error({ err, routingKey }, 'failed to publish event');
  }
}

import { randomUUID } from 'node:crypto';
import type { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';
import { EXCHANGE, EXCHANGE_TYPE, type EventEnvelope, type RoutingKey } from '@sbs/contracts';

let channel: ChannelWrapper | null = null;

function getPublisher(connection: AmqpConnectionManager): ChannelWrapper {
  if (!channel) {
    channel = connection.createChannel({
      json: true,
      setup: async (ch: ConfirmChannel) => {
        await ch.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
      },
    });
  }
  return channel;
}

/** Publishes a domain event to the topic exchange (used by webhook processing). */
export async function publishEvent<T>(
  connection: AmqpConnectionManager,
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
  await getPublisher(connection).publish(EXCHANGE, routingKey, envelope, {
    persistent: true,
    contentType: 'application/json',
    messageId: envelope.eventId,
    correlationId: envelope.correlationId,
  });
}

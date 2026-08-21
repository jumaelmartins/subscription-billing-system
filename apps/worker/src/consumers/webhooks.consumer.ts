import type { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { EXCHANGE, EXCHANGE_TYPE, Queues, RoutingKeys, type EventEnvelope } from '@sbs/contracts';
import { processWebhook } from '../handlers/webhook.handler';
import { logger } from '../logger';

export function startWebhooksConsumer(connection: AmqpConnectionManager): ChannelWrapper {
  const wrapper = connection.createChannel({
    json: true,
    setup: async (ch: ConfirmChannel) => {
      await ch.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
      await ch.assertQueue(Queues.DeadLetter, { durable: true });
      await ch.assertQueue(Queues.Webhooks, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': Queues.DeadLetter,
        },
      });
      await ch.bindQueue(Queues.Webhooks, EXCHANGE, RoutingKeys.PaymentWebhookReceived);
      await ch.prefetch(5);
      await ch.consume(Queues.Webhooks, (msg) => {
        if (msg) void onMessage(connection, wrapper, msg);
      });
      logger.info({ queue: Queues.Webhooks }, 'webhooks consumer ready');
    },
  });
  return wrapper;
}

async function onMessage(
  connection: AmqpConnectionManager,
  wrapper: ChannelWrapper,
  msg: ConsumeMessage,
): Promise<void> {
  try {
    const evt = JSON.parse(msg.content.toString()) as EventEnvelope;
    await processWebhook(connection, evt);
    wrapper.ack(msg);
  } catch (err) {
    logger.error({ err }, 'webhook processing failed; dead-lettering message');
    wrapper.nack(msg, false, false);
  }
}

import type { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { EXCHANGE, EXCHANGE_TYPE, Queues, RoutingKeys, type EventEnvelope } from '@sbs/contracts';
import { handleNotification } from '../handlers/notification.handler';
import { logger } from '../logger';
import { messagesFailed, messagesProcessed } from '../metrics';

const NOTIFICATION_KEYS = [
  RoutingKeys.SubscriptionCreated,
  RoutingKeys.SubscriptionCanceled,
  RoutingKeys.SubscriptionPlanChanged,
  RoutingKeys.SubscriptionReactivated,
  RoutingKeys.InvoiceCreated,
  RoutingKeys.InvoicePaid,
  RoutingKeys.InvoicePaymentFailed,
];

export function startNotificationsConsumer(connection: AmqpConnectionManager): ChannelWrapper {
  const wrapper = connection.createChannel({
    json: true,
    setup: async (ch: ConfirmChannel) => {
      await ch.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
      await ch.assertQueue(Queues.DeadLetter, { durable: true });
      await ch.assertQueue(Queues.Notifications, {
        durable: true,
        // Failed messages are dead-lettered to the DLQ via the default exchange.
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': Queues.DeadLetter,
        },
      });
      for (const key of NOTIFICATION_KEYS) {
        await ch.bindQueue(Queues.Notifications, EXCHANGE, key);
      }
      await ch.prefetch(10);
      await ch.consume(Queues.Notifications, (msg) => {
        if (msg) void onMessage(wrapper, msg);
      });
      logger.info({ queue: Queues.Notifications }, 'notifications consumer ready');
    },
  });
  return wrapper;
}

async function onMessage(wrapper: ChannelWrapper, msg: ConsumeMessage): Promise<void> {
  try {
    const evt = JSON.parse(msg.content.toString()) as EventEnvelope;
    await handleNotification(evt);
    wrapper.ack(msg);
    messagesProcessed.inc({ consumer: 'notifications' });
  } catch (err) {
    logger.error({ err }, 'notification failed; dead-lettering message');
    wrapper.nack(msg, false, false);
    messagesFailed.inc({ consumer: 'notifications' });
  }
}

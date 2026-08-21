import { eq } from 'drizzle-orm';
import type { AmqpConnectionManager } from 'amqp-connection-manager';
import { db, invoices, payments, subscriptions, webhookEvents } from '@sbs/db';
import { RoutingKeys, type EventEnvelope, type WebhookReceivedPayload } from '@sbs/contracts';
import { logger } from '../logger';
import { publishEvent } from '../publisher';

/**
 * Processes a received payment webhook idempotently. Two guards protect against
 * duplicate delivery: the webhook_event status check, and conditional invoice
 * updates (an already-paid invoice is never charged twice). Everything runs in
 * a single transaction; failures dead-letter the message.
 */
export async function processWebhook(
  connection: AmqpConnectionManager,
  evt: EventEnvelope,
): Promise<void> {
  const payload = evt.payload as WebhookReceivedPayload;

  const [we] = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.id, payload.webhookEventId))
    .limit(1);
  if (!we) {
    logger.warn({ id: payload.webhookEventId }, 'webhook event not found; acking');
    return;
  }
  if (we.status === 'processed') {
    logger.info({ id: we.id, correlationId: evt.correlationId }, 'webhook already processed; skipping');
    return;
  }

  let result: { invoiceId: string; customerId: string; subscriptionId: string } | null = null;
  try {
    result = await db.transaction(async (tx) => {
      const [invoice] = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.id, payload.data.invoiceId))
        .limit(1);
      if (!invoice) throw new Error(`invoice ${payload.data.invoiceId} not found`);

      const [sub] = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, invoice.subscriptionId))
        .limit(1);

      if (payload.eventType === 'invoice.paid') {
        if (invoice.status !== 'paid') {
          await tx
            .update(invoices)
            .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
            .where(eq(invoices.id, invoice.id));
          await tx.insert(payments).values({
            invoiceId: invoice.id,
            provider: we.provider,
            providerPaymentId: we.providerEventId,
            status: 'paid',
            amount: invoice.amount,
            paidAt: new Date(),
          });
          if (sub && (sub.status === 'past_due' || sub.status === 'trialing')) {
            await tx
              .update(subscriptions)
              .set({ status: 'active', updatedAt: new Date() })
              .where(eq(subscriptions.id, sub.id));
          }
        }
      } else if (invoice.status !== 'failed' && invoice.status !== 'paid') {
        await tx
          .update(invoices)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(eq(invoices.id, invoice.id));
        await tx.insert(payments).values({
          invoiceId: invoice.id,
          provider: we.provider,
          providerPaymentId: we.providerEventId,
          status: 'failed',
          amount: invoice.amount,
          failedAt: new Date(),
        });
        if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
          await tx
            .update(subscriptions)
            .set({ status: 'past_due', updatedAt: new Date() })
            .where(eq(subscriptions.id, sub.id));
        }
      }

      await tx
        .update(webhookEvents)
        .set({ status: 'processed', processedAt: new Date() })
        .where(eq(webhookEvents.id, we.id));

      return {
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        subscriptionId: invoice.subscriptionId,
      };
    });
  } catch (err) {
    await db
      .update(webhookEvents)
      .set({ status: 'failed' })
      .where(eq(webhookEvents.id, we.id))
      .catch(() => {});
    throw err;
  }

  if (result) {
    const rk =
      payload.eventType === 'invoice.paid'
        ? RoutingKeys.InvoicePaid
        : RoutingKeys.InvoicePaymentFailed;
    await publishEvent(connection, rk, result, { correlationId: evt.correlationId }).catch(() => {});
    if (payload.eventType === 'invoice.paid') {
      await publishEvent(
        connection,
        RoutingKeys.SubscriptionActivated,
        { subscriptionId: result.subscriptionId, customerId: result.customerId },
        { correlationId: evt.correlationId },
      ).catch(() => {});
    }
    logger.info(
      { webhookEventId: we.id, eventType: payload.eventType, correlationId: evt.correlationId },
      'webhook processed',
    );
  }
}

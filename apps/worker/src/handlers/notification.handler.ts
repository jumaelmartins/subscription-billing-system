import { eq } from 'drizzle-orm';
import { customers, db, emailLog } from '@sbs/db';
import { RoutingKeys, type EventEnvelope, type RoutingKey } from '@sbs/contracts';
import { logger } from '../logger';

function render(routingKey: RoutingKey, name: string): { subject: string; body: string } {
  switch (routingKey) {
    case RoutingKeys.SubscriptionCreated:
      return { subject: 'Your subscription is active', body: `Hi ${name}, your subscription was created.` };
    case RoutingKeys.SubscriptionCanceled:
      return { subject: 'Subscription canceled', body: `Hi ${name}, your subscription was canceled.` };
    case RoutingKeys.SubscriptionPlanChanged:
      return { subject: 'Plan updated', body: `Hi ${name}, your plan was changed.` };
    case RoutingKeys.SubscriptionReactivated:
      return { subject: 'Welcome back', body: `Hi ${name}, your subscription is active again.` };
    case RoutingKeys.InvoiceCreated:
      return { subject: 'New invoice', body: `Hi ${name}, a new invoice was generated.` };
    case RoutingKeys.InvoicePaid:
      return { subject: 'Payment received', body: `Hi ${name}, we received your payment.` };
    case RoutingKeys.InvoicePaymentFailed:
      return { subject: 'Payment failed', body: `Hi ${name}, your last payment failed.` };
    default:
      return { subject: 'Notification', body: `Hi ${name}.` };
  }
}

/** Writes a fake outbound email to `email_log` for the event's customer. */
export async function handleNotification(evt: EventEnvelope): Promise<void> {
  const payload = (evt.payload ?? {}) as { customerId?: string };
  if (!payload.customerId) {
    logger.warn({ routingKey: evt.routingKey }, 'notification: missing customerId');
    return;
  }

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, payload.customerId))
    .limit(1);
  if (!customer) {
    logger.warn({ customerId: payload.customerId }, 'notification: customer not found');
    return;
  }

  const { subject, body } = render(evt.routingKey, customer.name);
  await db.insert(emailLog).values({ to: customer.email, subject, body, eventType: evt.routingKey });
  logger.info(
    { to: customer.email, event: evt.routingKey, correlationId: evt.correlationId },
    'notification email logged',
  );
}

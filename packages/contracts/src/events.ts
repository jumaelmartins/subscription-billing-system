/**
 * RabbitMQ topology and domain event names.
 * Single source of truth shared by api and worker (see docs/architecture.md).
 */

/** Main topic exchange. */
export const EXCHANGE = 'billing.events' as const;
export const EXCHANGE_TYPE = 'topic' as const;

/** Routing keys published to the topic exchange. */
export const RoutingKeys = {
  SubscriptionCreated: 'subscription.created',
  SubscriptionActivated: 'subscription.activated',
  SubscriptionPlanChanged: 'subscription.plan_changed',
  SubscriptionCanceled: 'subscription.canceled',
  SubscriptionReactivated: 'subscription.reactivated',
  InvoiceCreated: 'invoice.created',
  InvoicePaid: 'invoice.paid',
  InvoicePaymentFailed: 'invoice.payment_failed',
  PaymentWebhookReceived: 'payment.webhook.received',
  PaymentWebhookProcessed: 'payment.webhook.processed',
  NotificationEmailRequested: 'notification.email.requested',
  AuditEventCreated: 'audit.event.created',
} as const;

export type RoutingKey = (typeof RoutingKeys)[keyof typeof RoutingKeys];

/** Durable queues bound to the exchange. */
export const Queues = {
  Webhooks: 'billing.webhooks.queue',
  Invoices: 'billing.invoices.queue',
  Notifications: 'billing.notifications.queue',
  Audit: 'billing.audit.queue',
  Analytics: 'billing.analytics.queue',
  DeadLetter: 'billing.dead-letter.queue',
} as const;

export type QueueName = (typeof Queues)[keyof typeof Queues];

/**
 * Envelope wrapping every published message. `correlationId` ties together all
 * events of a single flow across api and workers (see docs/observability.md).
 */
export interface EventEnvelope<T = unknown> {
  eventId: string;
  routingKey: RoutingKey;
  occurredAt: string;
  correlationId: string;
  requestId?: string;
  payload: T;
}

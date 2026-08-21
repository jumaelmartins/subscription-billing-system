import { z } from 'zod';

/** Event delivered by the (fake) payment provider to the webhook endpoint. */
export const fakePaymentWebhookSchema = z.object({
  provider: z.string().min(1).default('fake-payment-provider'),
  providerEventId: z.string().min(1),
  eventType: z.enum(['invoice.paid', 'invoice.payment_failed']),
  data: z.object({
    invoiceId: z.string().uuid(),
  }),
});

export type FakePaymentWebhook = z.infer<typeof fakePaymentWebhookSchema>;

/** Payload of the `payment.webhook.received` message handed to the worker. */
export interface WebhookReceivedPayload {
  webhookEventId: string;
  eventType: 'invoice.paid' | 'invoice.payment_failed';
  data: { invoiceId: string };
}

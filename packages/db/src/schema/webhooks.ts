import { jsonb, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: text('provider').notNull(),
    providerEventId: text('provider_event_id').notNull(),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload'),
    status: text('status').notNull().default('received'),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // The idempotency key: a provider never delivers two distinct events with
    // the same id, so a duplicate delivery collides here and is ignored.
    providerEventUnique: unique('webhook_events_provider_event_unique').on(
      t.provider,
      t.providerEventId,
    ),
  }),
);

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;

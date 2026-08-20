import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** Fake outbound email log written by the notifications worker. */
export const emailLog = pgTable('email_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  to: text('to').notNull(),
  subject: text('subject').notNull(),
  body: text('body'),
  status: text('status').notNull().default('sent'),
  eventType: text('event_type'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type EmailLog = typeof emailLog.$inferSelect;
export type NewEmailLog = typeof emailLog.$inferInsert;

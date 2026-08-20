import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { invoices } from './invoices';

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  providerPaymentId: text('provider_payment_id'),
  status: text('status').notNull().default('pending'),
  amount: integer('amount').notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

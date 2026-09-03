import { integer, pgTable } from 'drizzle-orm/pg-core';

/**
 * Per-year counter backing human-readable invoice numbers (INV-<year>-NNNN).
 * The sequential part restarts each year. Invoice generation increments the row
 * atomically (INSERT ... ON CONFLICT DO UPDATE ... RETURNING) inside the same
 * transaction, so concurrent generations never collide or skip.
 */
export const invoiceNumberCounters = pgTable('invoice_number_counters', {
  year: integer('year').primaryKey(),
  last: integer('last').notNull().default(0),
});

export type InvoiceNumberCounter = typeof invoiceNumberCounters.$inferSelect;

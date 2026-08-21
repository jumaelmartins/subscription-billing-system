import { count, eq, sum } from 'drizzle-orm';
import { customers, db, invoices, subscriptions } from '@sbs/db';

export interface DashboardSummary {
  customers: number;
  subscriptions: { total: number; active: number };
  invoices: { total: number; paid: number; open: number };
  revenueCents: number;
}

export async function getSummary(): Promise<DashboardSummary> {
  const [c, subTotal, subActive, invTotal, invPaid, invOpen, rev] = await Promise.all([
    db.select({ v: count() }).from(customers),
    db.select({ v: count() }).from(subscriptions),
    db.select({ v: count() }).from(subscriptions).where(eq(subscriptions.status, 'active')),
    db.select({ v: count() }).from(invoices),
    db.select({ v: count() }).from(invoices).where(eq(invoices.status, 'paid')),
    db.select({ v: count() }).from(invoices).where(eq(invoices.status, 'open')),
    db.select({ v: sum(invoices.amount) }).from(invoices).where(eq(invoices.status, 'paid')),
  ]);

  return {
    customers: c[0]!.v,
    subscriptions: { total: subTotal[0]!.v, active: subActive[0]!.v },
    invoices: { total: invTotal[0]!.v, paid: invPaid[0]!.v, open: invOpen[0]!.v },
    revenueCents: Number(rev[0]!.v ?? 0),
  };
}

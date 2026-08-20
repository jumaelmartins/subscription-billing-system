import { desc, eq } from 'drizzle-orm';
import type { GenerateInvoice } from '@sbs/contracts';
import { db } from '../../shared/database/client';
import { invoices, plans, subscriptions } from '../../shared/database/schema';
import { notFound } from '../../shared/errors';
import { recordAudit } from '../audit/audit.service';

const DEFAULT_DUE_DAYS = 7;

export const invoicesService = {
  list(limit: number, offset: number, subscriptionId?: string) {
    const where = subscriptionId ? eq(invoices.subscriptionId, subscriptionId) : undefined;
    return db
      .select()
      .from(invoices)
      .where(where)
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async get(id: string) {
    const [row] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    if (!row) throw notFound('invoice not found');
    return row;
  },

  /** Generates an open invoice for a subscription at its plan's current price. */
  async generate(input: GenerateInvoice, actorId: string) {
    return db.transaction(async (tx) => {
      const [sub] = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, input.subscriptionId))
        .limit(1);
      if (!sub) throw notFound('subscription not found');
      const [plan] = await tx.select().from(plans).where(eq(plans.id, sub.planId)).limit(1);
      if (!plan) throw notFound('plan not found');

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (input.dueInDays ?? DEFAULT_DUE_DAYS));

      const [invoice] = await tx
        .insert(invoices)
        .values({
          subscriptionId: sub.id,
          customerId: sub.customerId,
          amount: plan.price,
          status: 'open',
          dueDate,
        })
        .returning();

      await recordAudit(tx, {
        actorId,
        action: 'invoice.created',
        entityType: 'invoice',
        entityId: invoice!.id,
        metadata: { subscriptionId: sub.id, amount: plan.price },
      });
      return invoice!;
    });
  },
};

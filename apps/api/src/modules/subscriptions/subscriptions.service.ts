import { desc, eq } from 'drizzle-orm';
import type {
  BillingCycle,
  CancelSubscription,
  ChangePlan,
  CreateSubscription,
  SubscriptionStatus,
} from '@sbs/contracts';
import { db } from '../../shared/database/client';
import { customers, plans, subscriptions } from '../../shared/database/schema';
import { notFound } from '../../shared/errors';
import { recordAudit } from '../audit/audit.service';
import { addCycle, assertTransition } from './subscription.transitions';

const DEFAULT_TRIAL_DAYS = 14;

export const subscriptionsService = {
  list(limit: number, offset: number) {
    return db
      .select()
      .from(subscriptions)
      .orderBy(desc(subscriptions.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async get(id: string) {
    const [row] = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
    if (!row) throw notFound('subscription not found');
    return row;
  },

  async create(input: CreateSubscription, actorId: string) {
    return db.transaction(async (tx) => {
      const [plan] = await tx.select().from(plans).where(eq(plans.id, input.planId)).limit(1);
      if (!plan) throw notFound('plan not found');
      const [customer] = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, input.customerId))
        .limit(1);
      if (!customer) throw notFound('customer not found');

      const now = new Date();
      const cycle = plan.billingCycle as BillingCycle;

      const values = input.trial
        ? (() => {
            const trialEnd = new Date(now);
            trialEnd.setDate(trialEnd.getDate() + (input.trialDays ?? DEFAULT_TRIAL_DAYS));
            return {
              customerId: input.customerId,
              planId: input.planId,
              status: 'trialing',
              trialStartAt: now,
              trialEndAt: trialEnd,
              currentPeriodStart: now,
              currentPeriodEnd: trialEnd,
            };
          })()
        : {
            customerId: input.customerId,
            planId: input.planId,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: addCycle(now, cycle),
          };

      const [created] = await tx.insert(subscriptions).values(values).returning();
      await recordAudit(tx, {
        actorId,
        action: 'subscription.created',
        entityType: 'subscription',
        entityId: created!.id,
        metadata: { customerId: input.customerId, planId: input.planId, trial: !!input.trial },
      });
      return created!;
    });
  },

  async changePlan(id: string, input: ChangePlan, actorId: string) {
    return db.transaction(async (tx) => {
      const [sub] = await tx.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
      if (!sub) throw notFound('subscription not found');
      const [plan] = await tx.select().from(plans).where(eq(plans.id, input.planId)).limit(1);
      if (!plan) throw notFound('plan not found');

      const [updated] = await tx
        .update(subscriptions)
        .set({ planId: input.planId, updatedAt: new Date() })
        .where(eq(subscriptions.id, id))
        .returning();
      await recordAudit(tx, {
        actorId,
        action: 'subscription.plan_changed',
        entityType: 'subscription',
        entityId: id,
        metadata: { from: sub.planId, to: input.planId },
      });
      return updated!;
    });
  },

  async cancel(id: string, input: CancelSubscription, actorId: string) {
    return db.transaction(async (tx) => {
      const [sub] = await tx.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
      if (!sub) throw notFound('subscription not found');
      assertTransition(sub.status as SubscriptionStatus, 'canceled');

      const [updated] = await tx
        .update(subscriptions)
        .set({ status: 'canceled', canceledAt: new Date(), updatedAt: new Date() })
        .where(eq(subscriptions.id, id))
        .returning();
      await recordAudit(tx, {
        actorId,
        action: 'subscription.canceled',
        entityType: 'subscription',
        entityId: id,
        metadata: { reason: input.reason ?? null },
      });
      return updated!;
    });
  },

  async reactivate(id: string, actorId: string) {
    return db.transaction(async (tx) => {
      const [sub] = await tx.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
      if (!sub) throw notFound('subscription not found');
      assertTransition(sub.status as SubscriptionStatus, 'active');
      const [plan] = await tx.select().from(plans).where(eq(plans.id, sub.planId)).limit(1);
      if (!plan) throw notFound('plan not found');

      const now = new Date();
      const [updated] = await tx
        .update(subscriptions)
        .set({
          status: 'active',
          canceledAt: null,
          currentPeriodStart: now,
          currentPeriodEnd: addCycle(now, plan.billingCycle as BillingCycle),
          updatedAt: now,
        })
        .where(eq(subscriptions.id, id))
        .returning();
      await recordAudit(tx, {
        actorId,
        action: 'subscription.reactivated',
        entityType: 'subscription',
        entityId: id,
      });
      return updated!;
    });
  },
};

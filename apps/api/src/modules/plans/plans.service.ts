import { desc, eq } from 'drizzle-orm';
import type { CreatePlan, UpdatePlan } from '@sbs/contracts';
import { db } from '../../shared/database/client';
import { planFeatures, plans } from '../../shared/database/schema';
import { notFound } from '../../shared/errors';
import { recordAudit } from '../audit/audit.service';

export const plansService = {
  list(limit: number, offset: number) {
    return db.select().from(plans).orderBy(desc(plans.createdAt)).limit(limit).offset(offset);
  },

  async get(id: string) {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
    if (!plan) throw notFound('plan not found');
    const features = await db.select().from(planFeatures).where(eq(planFeatures.planId, id));
    return { ...plan, features };
  },

  async create(input: CreatePlan, actorId: string) {
    return db.transaction(async (tx) => {
      const [plan] = await tx
        .insert(plans)
        .values({
          name: input.name,
          description: input.description ?? null,
          price: input.price,
          billingCycle: input.billingCycle,
          maxUsers: input.maxUsers ?? null,
          maxProjects: input.maxProjects ?? null,
        })
        .returning();

      const features = input.features ?? [];
      if (features.length > 0) {
        await tx.insert(planFeatures).values(
          features.map((f) => ({
            planId: plan!.id,
            featureKey: f.featureKey,
            featureName: f.featureName,
            enabled: f.enabled ?? true,
            limitValue: f.limitValue ?? null,
          })),
        );
      }

      await recordAudit(tx, {
        actorId,
        action: 'plan.created',
        entityType: 'plan',
        entityId: plan!.id,
        metadata: { name: plan!.name, price: plan!.price },
      });

      const inserted = await tx.select().from(planFeatures).where(eq(planFeatures.planId, plan!.id));
      return { ...plan!, features: inserted };
    });
  },

  async update(id: string, input: UpdatePlan, actorId: string) {
    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(plans)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(plans.id, id))
        .returning();
      if (!updated) throw notFound('plan not found');

      await recordAudit(tx, {
        actorId,
        action: 'plan.updated',
        entityType: 'plan',
        entityId: id,
        metadata: input,
      });
      return updated;
    });
  },
};

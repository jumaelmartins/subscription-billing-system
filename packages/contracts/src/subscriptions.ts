import { z } from 'zod';

export const subscriptionStatus = z.enum([
  'trialing',
  'active',
  'past_due',
  'paused',
  'canceled',
  'expired',
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatus>;

export const createSubscriptionSchema = z.object({
  customerId: z.string().uuid(),
  planId: z.string().uuid(),
  trial: z.boolean().optional(),
  trialDays: z.number().int().positive().max(365).optional(),
});

export const changePlanSchema = z.object({
  planId: z.string().uuid(),
});

export const cancelSubscriptionSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CreateSubscription = z.infer<typeof createSubscriptionSchema>;
export type ChangePlan = z.infer<typeof changePlanSchema>;
export type CancelSubscription = z.infer<typeof cancelSubscriptionSchema>;

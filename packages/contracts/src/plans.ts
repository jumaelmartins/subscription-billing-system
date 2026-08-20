import { z } from 'zod';

export const billingCycle = z.enum(['monthly', 'yearly']);
export type BillingCycle = z.infer<typeof billingCycle>;

export const planFeatureInputSchema = z.object({
  featureKey: z.string().min(1),
  featureName: z.string().min(1),
  enabled: z.boolean().default(true),
  limitValue: z.number().int().nonnegative().nullable().optional(),
});

export const createPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().nonnegative(),
  billingCycle,
  maxUsers: z.number().int().positive().nullable().optional(),
  maxProjects: z.number().int().positive().nullable().optional(),
  features: z.array(planFeatureInputSchema).optional(),
});

export const updatePlanSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().int().nonnegative().optional(),
    billingCycle: billingCycle.optional(),
    maxUsers: z.number().int().positive().nullable().optional(),
    maxProjects: z.number().int().positive().nullable().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'at least one field is required' });

export type PlanFeatureInput = z.infer<typeof planFeatureInputSchema>;
export type CreatePlan = z.infer<typeof createPlanSchema>;
export type UpdatePlan = z.infer<typeof updatePlanSchema>;

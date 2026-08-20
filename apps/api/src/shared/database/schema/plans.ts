import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  // Price stored as integer minor units (cents) to avoid floating-point money.
  price: integer('price').notNull(),
  billingCycle: text('billing_cycle').notNull(),
  maxUsers: integer('max_users'),
  maxProjects: integer('max_projects'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const planFeatures = pgTable('plan_features', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  featureKey: text('feature_key').notNull(),
  featureName: text('feature_name').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  limitValue: integer('limit_value'),
});

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
export type PlanFeature = typeof planFeatures.$inferSelect;
export type NewPlanFeature = typeof planFeatures.$inferInsert;

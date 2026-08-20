import type { SubscriptionStatus } from '@sbs/contracts';
import type { BillingCycle } from '@sbs/contracts';
import { AppError } from '../../shared/errors';

/** Allowed subscription status transitions (see docs/domain-model.md). */
const ALLOWED: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  trialing: ['active', 'past_due', 'canceled', 'expired'],
  active: ['past_due', 'paused', 'canceled'],
  past_due: ['active', 'canceled', 'expired'],
  paused: ['active', 'canceled'],
  canceled: ['active'],
  expired: ['active'],
};

export function canTransition(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function assertTransition(from: SubscriptionStatus, to: SubscriptionStatus): void {
  if (!canTransition(from, to)) {
    throw new AppError(409, 'invalid_transition', `cannot transition from ${from} to ${to}`);
  }
}

/** Returns `start` advanced by one billing cycle. */
export function addCycle(start: Date, cycle: BillingCycle): Date {
  const end = new Date(start);
  if (cycle === 'monthly') {
    end.setMonth(end.getMonth() + 1);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }
  return end;
}

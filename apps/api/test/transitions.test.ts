import { describe, expect, it } from 'vitest';
import {
  addCycle,
  assertTransition,
  canTransition,
} from '../src/modules/subscriptions/subscription.transitions';

describe('subscription transitions', () => {
  it('allows valid transitions', () => {
    expect(canTransition('active', 'canceled')).toBe(true);
    expect(canTransition('trialing', 'active')).toBe(true);
    expect(canTransition('past_due', 'active')).toBe(true);
    expect(canTransition('canceled', 'active')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(canTransition('canceled', 'canceled')).toBe(false);
    expect(canTransition('active', 'active')).toBe(false);
    expect(canTransition('paused', 'expired')).toBe(false);
    expect(() => assertTransition('canceled', 'paused')).toThrowError();
  });

  it('advances billing periods by cycle', () => {
    const start = new Date('2026-01-15T12:00:00Z');
    expect(addCycle(start, 'monthly').getUTCMonth()).toBe(1); // February
    expect(addCycle(start, 'yearly').getUTCFullYear()).toBe(2027);
  });
});

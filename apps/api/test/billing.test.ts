import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { LightMyRequestResponse } from 'fastify';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer;
let app: Awaited<ReturnType<(typeof import('../src/app'))['buildApp']>>;
let closeDb: () => Promise<unknown>;
let cookie: string;
let customerId: string;
let planId: string;

function post(url: string, payload?: object): Promise<LightMyRequestResponse> {
  return app.inject({ method: 'POST', url, cookies: { token: cookie }, payload });
}

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  process.env.DATABASE_URL = container.getConnectionUri();
  process.env.JWT_SECRET = 'test-secret-at-least-16-characters';
  process.env.ADMIN_EMAIL = 'admin@test.dev';
  process.env.ADMIN_PASSWORD = 'supersecret123';

  const { runMigrations } = await import('../src/shared/database/migrator');
  await runMigrations();
  const { seedAdmin } = await import('../src/modules/auth/admin.seed');
  await seedAdmin();
  const { buildApp } = await import('../src/app');
  app = await buildApp();
  const { sql } = await import('../src/shared/database/pool');
  closeDb = () => sql.end({ timeout: 5 });

  const login = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'admin@test.dev', password: 'supersecret123' },
  });
  cookie = login.cookies.find((c) => c.name === 'token')!.value;

  customerId = (await post('/customers', { name: 'Biller', email: 'biller@corp.dev' })).json().id;
  planId = (
    await post('/plans', { name: 'Basic', price: 1990, billingCycle: 'monthly' })
  ).json().id;
}, 120_000);

afterAll(async () => {
  await app?.close();
  await closeDb?.();
  await container?.stop();
});

describe('subscriptions + billing', () => {
  it('creates an active subscription and generates an invoice at the plan price', async () => {
    const sub = await post('/subscriptions', { customerId, planId });
    expect(sub.statusCode).toBe(201);
    expect(sub.json()).toMatchObject({ status: 'active' });
    const subId = sub.json().id as string;

    const invoice = await post('/invoices', { subscriptionId: subId });
    expect(invoice.statusCode).toBe(201);
    expect(invoice.json()).toMatchObject({ status: 'open', amount: 1990, subscriptionId: subId });
  });

  it('creates a trial subscription in the trialing state', async () => {
    const sub = await post('/subscriptions', { customerId, planId, trial: true, trialDays: 7 });
    expect(sub.json()).toMatchObject({ status: 'trialing' });
    expect(sub.json().trialEndAt).toBeTruthy();
  });

  it('cancels then reactivates, and rejects a double cancel with 409', async () => {
    const subId = (await post('/subscriptions', { customerId, planId })).json().id as string;

    const canceled = await post(`/subscriptions/${subId}/cancel`, { reason: 'testing' });
    expect(canceled.json()).toMatchObject({ status: 'canceled' });
    expect(canceled.json().canceledAt).toBeTruthy();

    const doubleCancel = await post(`/subscriptions/${subId}/cancel`, {});
    expect(doubleCancel.statusCode).toBe(409);

    const reactivated = await post(`/subscriptions/${subId}/reactivate`);
    expect(reactivated.json()).toMatchObject({ status: 'active' });
    expect(reactivated.json().canceledAt).toBeNull();
  });

  it('changes the plan of a subscription', async () => {
    const subId = (await post('/subscriptions', { customerId, planId })).json().id as string;
    const otherPlan = (
      await post('/plans', { name: 'Pro', price: 4990, billingCycle: 'yearly' })
    ).json().id as string;

    const changed = await post(`/subscriptions/${subId}/change-plan`, { planId: otherPlan });
    expect(changed.statusCode).toBe(200);
    expect(changed.json()).toMatchObject({ planId: otherPlan });
  });
});

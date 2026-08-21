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
let invoiceId: string;

function authedPost(url: string, payload?: object): Promise<LightMyRequestResponse> {
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

  const customerId = (await authedPost('/customers', { name: 'Payer', email: 'payer@corp.dev' })).json()
    .id;
  const planId = (
    await authedPost('/plans', { name: 'Basic', price: 2500, billingCycle: 'monthly' })
  ).json().id;
  const subId = (await authedPost('/subscriptions', { customerId, planId })).json().id;
  invoiceId = (await authedPost('/invoices', { subscriptionId: subId })).json().id;
}, 120_000);

afterAll(async () => {
  await app?.close();
  await closeDb?.();
  await container?.stop();
});

describe('webhook intake (idempotency layer 1)', () => {
  it('accepts a new webhook and ignores a duplicate delivery', async () => {
    const body = {
      provider: 'fake-payment-provider',
      providerEventId: 'evt-dedupe-1',
      eventType: 'invoice.paid',
      data: { invoiceId },
    };
    const first = await app.inject({ method: 'POST', url: '/webhooks/fake-payment-provider', payload: body });
    expect(first.statusCode).toBe(202);
    expect(first.json()).toMatchObject({ status: 'accepted' });

    const second = await app.inject({ method: 'POST', url: '/webhooks/fake-payment-provider', payload: body });
    expect(second.statusCode).toBe(200);
    expect(second.json()).toMatchObject({ status: 'duplicate' });

    const list = await app.inject({ method: 'GET', url: '/webhooks', cookies: { token: cookie } });
    const matching = (list.json() as Array<{ providerEventId: string }>).filter(
      (w) => w.providerEventId === 'evt-dedupe-1',
    );
    expect(matching).toHaveLength(1);
  });

  it('simulate-payment feeds the webhook path and requires auth', async () => {
    const sim = await authedPost(`/invoices/${invoiceId}/simulate-payment`);
    expect(sim.json()).toMatchObject({ status: 'accepted' });

    const unauth = await app.inject({
      method: 'POST',
      url: `/invoices/${invoiceId}/simulate-payment`,
    });
    expect(unauth.statusCode).toBe(401);
  });

  it('rejects an invalid webhook body with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/fake-payment-provider',
      payload: { providerEventId: '', eventType: 'nope', data: {} },
    });
    expect(res.statusCode).toBe(400);
  });
});

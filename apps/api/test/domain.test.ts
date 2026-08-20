import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer;
let app: Awaited<ReturnType<(typeof import('../src/app'))['buildApp']>>;
let closeDb: () => Promise<unknown>;
let cookie: string;

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
}, 120_000);

afterAll(async () => {
  await app?.close();
  await closeDb?.();
  await container?.stop();
});

describe('customers', () => {
  it('requires authentication', async () => {
    const res = await app.inject({ method: 'GET', url: '/customers' });
    expect(res.statusCode).toBe(401);
  });

  it('creates, lists, updates and deactivates a customer, and records audit', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/customers',
      cookies: { token: cookie },
      payload: { name: 'Acme Inc', email: 'acme@corp.dev', document: '123456' },
    });
    expect(create.statusCode).toBe(201);
    const id = create.json().id as string;
    expect(create.json()).toMatchObject({ name: 'Acme Inc', status: 'active' });

    const list = await app.inject({ method: 'GET', url: '/customers', cookies: { token: cookie } });
    expect(list.statusCode).toBe(200);
    expect((list.json() as unknown[]).length).toBeGreaterThanOrEqual(1);

    const update = await app.inject({
      method: 'PATCH',
      url: `/customers/${id}`,
      cookies: { token: cookie },
      payload: { name: 'Acme Corp' },
    });
    expect(update.json()).toMatchObject({ name: 'Acme Corp' });

    const deactivate = await app.inject({
      method: 'POST',
      url: `/customers/${id}/deactivate`,
      cookies: { token: cookie },
    });
    expect(deactivate.json()).toMatchObject({ status: 'inactive' });

    const audit = await app.inject({ method: 'GET', url: '/audit', cookies: { token: cookie } });
    const actions = (audit.json() as Array<{ action: string }>).map((a) => a.action);
    expect(actions).toEqual(
      expect.arrayContaining(['customer.created', 'customer.updated', 'customer.deactivated']),
    );
  });

  it('rejects duplicate email with 409', async () => {
    await app.inject({
      method: 'POST',
      url: '/customers',
      cookies: { token: cookie },
      payload: { name: 'Dup One', email: 'dup@corp.dev' },
    });
    const second = await app.inject({
      method: 'POST',
      url: '/customers',
      cookies: { token: cookie },
      payload: { name: 'Dup Two', email: 'dup@corp.dev' },
    });
    expect(second.statusCode).toBe(409);
  });

  it('rejects invalid input with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/customers',
      cookies: { token: cookie },
      payload: { name: '', email: 'not-an-email' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('plans', () => {
  it('creates a plan with features and reads it back', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/plans',
      cookies: { token: cookie },
      payload: {
        name: 'Pro',
        price: 4900,
        billingCycle: 'monthly',
        maxUsers: 10,
        features: [{ featureKey: 'api', featureName: 'API access', enabled: true, limitValue: 1000 }],
      },
    });
    expect(create.statusCode).toBe(201);
    const id = create.json().id as string;
    expect(create.json().features).toHaveLength(1);

    const get = await app.inject({ method: 'GET', url: `/plans/${id}`, cookies: { token: cookie } });
    expect(get.statusCode).toBe(200);
    expect(get.json()).toMatchObject({ name: 'Pro', price: 4900, billingCycle: 'monthly' });
    expect(get.json().features[0]).toMatchObject({ featureKey: 'api', enabled: true });
  });

  it('returns 404 for an unknown plan', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/plans/00000000-0000-0000-0000-000000000000',
      cookies: { token: cookie },
    });
    expect(res.statusCode).toBe(404);
  });
});

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer;
let app: Awaited<ReturnType<(typeof import('../src/app'))['buildApp']>>;
let closeDb: () => Promise<unknown>;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();

  // Point the app modules at the container before they are first imported.
  process.env.DATABASE_URL = container.getConnectionUri();
  process.env.JWT_SECRET = 'test-secret-at-least-16-characters';
  process.env.ADMIN_EMAIL = 'admin@test.dev';
  process.env.ADMIN_PASSWORD = 'supersecret123';
  process.env.ADMIN_NAME = 'Test Admin';

  const { runMigrations } = await import('../src/shared/database/migrator');
  await runMigrations();
  const { seedAdmin } = await import('../src/modules/auth/admin.seed');
  await seedAdmin();
  const { buildApp } = await import('../src/app');
  app = await buildApp();
  const { sql } = await import('../src/shared/database/pool');
  closeDb = () => sql.end({ timeout: 5 });
}, 120_000);

afterAll(async () => {
  await app?.close();
  await closeDb?.();
  await container?.stop();
});

describe('auth', () => {
  it('rejects invalid credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'admin@test.dev', password: 'wrong-password' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('logs in the seeded admin, sets an httpOnly cookie, and /auth/me works', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'admin@test.dev', password: 'supersecret123' },
    });
    expect(login.statusCode).toBe(200);
    expect(login.json()).toMatchObject({ email: 'admin@test.dev', role: 'admin' });

    const cookie = login.cookies.find((c) => c.name === 'token');
    expect(cookie?.value).toBeTruthy();
    expect(cookie?.httpOnly).toBe(true);

    const me = await app.inject({
      method: 'GET',
      url: '/auth/me',
      cookies: { token: cookie!.value },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({ email: 'admin@test.dev', role: 'admin' });
  });

  it('blocks /auth/me without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/me' });
    expect(res.statusCode).toBe(401);
  });
});

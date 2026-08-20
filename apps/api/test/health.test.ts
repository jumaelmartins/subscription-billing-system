import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import { closeBroker } from '../src/shared/messaging/connection';
import { sql } from '../src/shared/database/pool';

describe('health & metrics (no external deps)', () => {
  afterAll(async () => {
    await closeBroker();
    await sql.end({ timeout: 1 }).catch(() => {});
  });

  it('GET /metrics returns prometheus exposition text', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/metrics' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('process_cpu_user_seconds_total');
    await app.close();
  });

  it('GET /health reports the health shape (degraded when deps are down)', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect([200, 503]).toContain(res.statusCode);
    const body = res.json();
    expect(body).toMatchObject({
      checks: { database: expect.any(String), broker: expect.any(String) },
    });
    await app.close();
  });
});

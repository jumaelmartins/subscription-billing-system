import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AmqpConnectionManager } from 'amqp-connection-manager';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { RabbitMQContainer, type StartedRabbitMQContainer } from '@testcontainers/rabbitmq';

let pg: StartedPostgreSqlContainer;
let rabbit: StartedRabbitMQContainer;
let connection: AmqpConnectionManager;
let dbMod: typeof import('@sbs/db');

beforeAll(async () => {
  [pg, rabbit] = await Promise.all([
    new PostgreSqlContainer('postgres:16-alpine').start(),
    new RabbitMQContainer('rabbitmq:3.13-management-alpine').start(),
  ]);
  process.env.DATABASE_URL = pg.getConnectionUri();
  process.env.RABBITMQ_URL = rabbit.getAmqpUrl();

  dbMod = await import('@sbs/db');
  await dbMod.runMigrations();

  const { getConnection } = await import('../src/broker');
  const { startNotificationsConsumer } = await import('../src/consumers/notifications.consumer');
  connection = getConnection();
  const consumer = startNotificationsConsumer(connection);
  await consumer.waitForConnect();
}, 180_000);

afterAll(async () => {
  const { closeConnection } = await import('../src/broker');
  await closeConnection();
  await dbMod.sql.end({ timeout: 5 }).catch(() => {});
  await Promise.all([pg?.stop(), rabbit?.stop()]);
});

describe('notifications worker', () => {
  it('consumes a published event and writes an email_log row', async () => {
    const { customers, emailLog, db } = dbMod;
    const { eq } = await import('drizzle-orm');
    const { publishEvent } = await import('../src/publisher');
    const { RoutingKeys } = await import('@sbs/contracts');

    const email = `user-${randomUUID().slice(0, 8)}@corp.dev`;
    const [customer] = await db.insert(customers).values({ name: 'Eventful', email }).returning();

    await publishEvent(connection, RoutingKeys.SubscriptionCreated, {
      customerId: customer!.id,
      subscriptionId: randomUUID(),
      planId: randomUUID(),
    });

    let rows: Array<{ eventType: string | null }> = [];
    for (let i = 0; i < 40; i++) {
      rows = await db.select().from(emailLog).where(eq(emailLog.to, email));
      if (rows.length > 0) break;
      await new Promise((r) => setTimeout(r, 250));
    }

    expect(rows).toHaveLength(1);
    expect(rows[0]!.eventType).toBe('subscription.created');
  });
});

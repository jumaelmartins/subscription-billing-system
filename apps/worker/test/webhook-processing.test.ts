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

async function seedInvoice(status: 'trialing' | 'past_due' | 'active') {
  const { db, customers, plans, subscriptions, invoices } = dbMod;
  const [customer] = await db
    .insert(customers)
    .values({ name: 'WH', email: `wh-${randomUUID().slice(0, 8)}@corp.dev` })
    .returning();
  const [plan] = await db
    .insert(plans)
    .values({ name: 'P', price: 3000, billingCycle: 'monthly' })
    .returning();
  const [sub] = await db
    .insert(subscriptions)
    .values({ customerId: customer!.id, planId: plan!.id, status })
    .returning();
  const [invoice] = await db
    .insert(invoices)
    .values({
      number: `INV-TEST-${randomUUID().slice(0, 8)}`,
      subscriptionId: sub!.id,
      customerId: customer!.id,
      amount: 3000,
      status: 'open',
    })
    .returning();
  return { customerId: customer!.id, subscriptionId: sub!.id, invoiceId: invoice!.id };
}

async function createWebhookEvent(invoiceId: string, eventType: 'invoice.paid' | 'invoice.payment_failed') {
  const { db, webhookEvents } = dbMod;
  const [we] = await db
    .insert(webhookEvents)
    .values({
      provider: 'fake-payment-provider',
      providerEventId: randomUUID(),
      eventType,
      payload: { invoiceId },
      status: 'received',
    })
    .returning();
  return we!;
}

async function waitFor<T>(fn: () => Promise<T | undefined>, tries = 40): Promise<T | undefined> {
  for (let i = 0; i < tries; i++) {
    const v = await fn();
    if (v) return v;
    await new Promise((r) => setTimeout(r, 250));
  }
  return undefined;
}

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
  const { startWebhooksConsumer } = await import('../src/consumers/webhooks.consumer');
  connection = getConnection();
  const consumer = startWebhooksConsumer(connection);
  await consumer.waitForConnect();
}, 180_000);

afterAll(async () => {
  const { closeConnection } = await import('../src/broker');
  await closeConnection();
  await dbMod.sql.end({ timeout: 5 }).catch(() => {});
  await Promise.all([pg?.stop(), rabbit?.stop()]);
});

describe('webhook processing (idempotency layer 2)', () => {
  it('pays an invoice once even when the event is delivered twice', async () => {
    const { db, invoices, payments, subscriptions, webhookEvents } = dbMod;
    const { eq } = await import('drizzle-orm');
    const { publishEvent } = await import('../src/publisher');
    const { RoutingKeys } = await import('@sbs/contracts');

    const { invoiceId, subscriptionId } = await seedInvoice('past_due');
    const we = await createWebhookEvent(invoiceId, 'invoice.paid');
    const message = {
      webhookEventId: we.id,
      eventType: 'invoice.paid' as const,
      data: { invoiceId },
    };

    await publishEvent(connection, RoutingKeys.PaymentWebhookReceived, message);

    const paid = await waitFor(async () => {
      const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
      return inv?.status === 'paid' ? inv : undefined;
    });
    expect(paid?.status).toBe('paid');

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);
    expect(sub!.status).toBe('active');

    const [we1] = await db.select().from(webhookEvents).where(eq(webhookEvents.id, we.id)).limit(1);
    expect(we1!.status).toBe('processed');

    // Deliver the exact same event again — must not create a second payment.
    await publishEvent(connection, RoutingKeys.PaymentWebhookReceived, message);
    await new Promise((r) => setTimeout(r, 1500));

    const pays = await db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
    expect(pays).toHaveLength(1);
    expect(pays[0]!.status).toBe('paid');
  });

  it('marks the invoice failed and the subscription past_due on payment failure', async () => {
    const { db, invoices, payments, subscriptions } = dbMod;
    const { eq } = await import('drizzle-orm');
    const { publishEvent } = await import('../src/publisher');
    const { RoutingKeys } = await import('@sbs/contracts');

    const { invoiceId, subscriptionId } = await seedInvoice('active');
    const we = await createWebhookEvent(invoiceId, 'invoice.payment_failed');

    await publishEvent(connection, RoutingKeys.PaymentWebhookReceived, {
      webhookEventId: we.id,
      eventType: 'invoice.payment_failed',
      data: { invoiceId },
    });

    const failed = await waitFor(async () => {
      const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
      return inv?.status === 'failed' ? inv : undefined;
    });
    expect(failed?.status).toBe('failed');

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);
    expect(sub!.status).toBe('past_due');

    const pays = await db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
    expect(pays).toHaveLength(1);
    expect(pays[0]!.status).toBe('failed');
  });
});

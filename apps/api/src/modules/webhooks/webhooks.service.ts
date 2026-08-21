import { randomUUID } from 'node:crypto';
import { desc } from 'drizzle-orm';
import { RoutingKeys, type FakePaymentWebhook } from '@sbs/contracts';
import { db, webhookEvents } from '@sbs/db';
import { publishEvent } from '../../shared/messaging/publisher';

type IngestResult = { status: 'accepted'; id: string } | { status: 'duplicate' };

/**
 * Persists a received webhook and publishes it for async processing. The unique
 * (provider, provider_event_id) constraint makes this idempotent: a duplicate
 * delivery inserts nothing and is acknowledged without re-publishing.
 */
export async function ingestWebhook(
  input: FakePaymentWebhook,
  correlationId?: string,
): Promise<IngestResult> {
  const [row] = await db
    .insert(webhookEvents)
    .values({
      provider: input.provider,
      providerEventId: input.providerEventId,
      eventType: input.eventType,
      payload: input.data,
      status: 'received',
    })
    .onConflictDoNothing({
      target: [webhookEvents.provider, webhookEvents.providerEventId],
    })
    .returning();

  if (!row) {
    return { status: 'duplicate' };
  }

  void publishEvent(
    RoutingKeys.PaymentWebhookReceived,
    { webhookEventId: row.id, eventType: input.eventType, data: input.data },
    { correlationId: correlationId ?? randomUUID() },
  );

  return { status: 'accepted', id: row.id };
}

export function listWebhooks(limit: number, offset: number) {
  return db
    .select()
    .from(webhookEvents)
    .orderBy(desc(webhookEvents.createdAt))
    .limit(limit)
    .offset(offset);
}

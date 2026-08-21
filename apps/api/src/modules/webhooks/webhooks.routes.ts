import type { FastifyInstance } from 'fastify';
import { fakePaymentWebhookSchema } from '@sbs/contracts';
import { parseInput } from '../../shared/errors';
import { ingestWebhook, listWebhooks } from './webhooks.service';

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  // Public intake: the provider is unauthenticated; validation + the unique
  // idempotency key guard it.
  app.post('/webhooks/fake-payment-provider', async (req, reply) => {
    const input = parseInput(fakePaymentWebhookSchema, req.body);
    const result = await ingestWebhook(input, req.id);
    reply.code(result.status === 'accepted' ? 202 : 200);
    return result;
  });

  // Admin listing (authenticated).
  app.get('/webhooks', { preHandler: [app.authenticate] }, async (req) => {
    const q = req.query as { limit?: string; offset?: string };
    const limit = Math.min(Number(q.limit ?? 50), 100);
    const offset = Math.max(Number(q.offset ?? 0), 0);
    return listWebhooks(limit, offset);
  });
}

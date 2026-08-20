import type { FastifyInstance } from 'fastify';
import {
  cancelSubscriptionSchema,
  changePlanSchema,
  createSubscriptionSchema,
} from '@sbs/contracts';
import { parseInput } from '../../shared/errors';
import { subscriptionsService } from './subscriptions.service';

export async function subscriptionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  app.get('/subscriptions', async (req) => {
    const q = req.query as { limit?: string; offset?: string };
    const limit = Math.min(Number(q.limit ?? 50), 100);
    const offset = Math.max(Number(q.offset ?? 0), 0);
    return subscriptionsService.list(limit, offset);
  });

  app.get('/subscriptions/:id', async (req) => {
    const { id } = req.params as { id: string };
    return subscriptionsService.get(id);
  });

  app.post('/subscriptions', async (req, reply) => {
    const input = parseInput(createSubscriptionSchema, req.body);
    const created = await subscriptionsService.create(input, req.user.sub);
    reply.code(201);
    return created;
  });

  app.post('/subscriptions/:id/change-plan', async (req) => {
    const { id } = req.params as { id: string };
    const input = parseInput(changePlanSchema, req.body);
    return subscriptionsService.changePlan(id, input, req.user.sub);
  });

  app.post('/subscriptions/:id/cancel', async (req) => {
    const { id } = req.params as { id: string };
    const input = parseInput(cancelSubscriptionSchema, req.body ?? {});
    return subscriptionsService.cancel(id, input, req.user.sub);
  });

  app.post('/subscriptions/:id/reactivate', async (req) => {
    const { id } = req.params as { id: string };
    return subscriptionsService.reactivate(id, req.user.sub);
  });
}

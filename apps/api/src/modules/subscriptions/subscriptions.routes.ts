import type { FastifyInstance } from 'fastify';
import {
  cancelSubscriptionSchema,
  changePlanSchema,
  createSubscriptionSchema,
  RoutingKeys,
} from '@sbs/contracts';
import { parseInput } from '../../shared/errors';
import { publishEvent } from '../../shared/messaging/publisher';
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
    void publishEvent(
      RoutingKeys.SubscriptionCreated,
      { subscriptionId: created.id, customerId: created.customerId, planId: created.planId },
      { correlationId: req.id, requestId: req.id },
    );
    reply.code(201);
    return created;
  });

  app.post('/subscriptions/:id/change-plan', async (req) => {
    const { id } = req.params as { id: string };
    const input = parseInput(changePlanSchema, req.body);
    const updated = await subscriptionsService.changePlan(id, input, req.user.sub);
    void publishEvent(
      RoutingKeys.SubscriptionPlanChanged,
      { subscriptionId: updated.id, customerId: updated.customerId, planId: updated.planId },
      { correlationId: req.id, requestId: req.id },
    );
    return updated;
  });

  app.post('/subscriptions/:id/cancel', async (req) => {
    const { id } = req.params as { id: string };
    const input = parseInput(cancelSubscriptionSchema, req.body ?? {});
    const updated = await subscriptionsService.cancel(id, input, req.user.sub);
    void publishEvent(
      RoutingKeys.SubscriptionCanceled,
      { subscriptionId: updated.id, customerId: updated.customerId },
      { correlationId: req.id, requestId: req.id },
    );
    return updated;
  });

  app.post('/subscriptions/:id/reactivate', async (req) => {
    const { id } = req.params as { id: string };
    const updated = await subscriptionsService.reactivate(id, req.user.sub);
    void publishEvent(
      RoutingKeys.SubscriptionReactivated,
      { subscriptionId: updated.id, customerId: updated.customerId },
      { correlationId: req.id, requestId: req.id },
    );
    return updated;
  });
}

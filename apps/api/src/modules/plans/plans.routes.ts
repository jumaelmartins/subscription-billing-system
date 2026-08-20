import type { FastifyInstance } from 'fastify';
import { createPlanSchema, updatePlanSchema } from '@sbs/contracts';
import { parseInput } from '../../shared/errors';
import { plansService } from './plans.service';

export async function planRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  app.get('/plans', async (req) => {
    const q = req.query as { limit?: string; offset?: string };
    const limit = Math.min(Number(q.limit ?? 50), 100);
    const offset = Math.max(Number(q.offset ?? 0), 0);
    return plansService.list(limit, offset);
  });

  app.get('/plans/:id', async (req) => {
    const { id } = req.params as { id: string };
    return plansService.get(id);
  });

  app.post('/plans', async (req, reply) => {
    const input = parseInput(createPlanSchema, req.body);
    const created = await plansService.create(input, req.user.sub);
    reply.code(201);
    return created;
  });

  app.patch('/plans/:id', async (req) => {
    const { id } = req.params as { id: string };
    const input = parseInput(updatePlanSchema, req.body);
    return plansService.update(id, input, req.user.sub);
  });
}

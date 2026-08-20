import type { FastifyInstance } from 'fastify';
import { createCustomerSchema, updateCustomerSchema } from '@sbs/contracts';
import { parseInput } from '../../shared/errors';
import { customersService } from './customers.service';

export async function customerRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  app.get('/customers', async (req) => {
    const q = req.query as { limit?: string; offset?: string };
    const limit = Math.min(Number(q.limit ?? 50), 100);
    const offset = Math.max(Number(q.offset ?? 0), 0);
    return customersService.list(limit, offset);
  });

  app.get('/customers/:id', async (req) => {
    const { id } = req.params as { id: string };
    return customersService.get(id);
  });

  app.post('/customers', async (req, reply) => {
    const input = parseInput(createCustomerSchema, req.body);
    const created = await customersService.create(input, req.user.sub);
    reply.code(201);
    return created;
  });

  app.patch('/customers/:id', async (req) => {
    const { id } = req.params as { id: string };
    const input = parseInput(updateCustomerSchema, req.body);
    return customersService.update(id, input, req.user.sub);
  });

  app.post('/customers/:id/deactivate', async (req) => {
    const { id } = req.params as { id: string };
    return customersService.deactivate(id, req.user.sub);
  });
}

import type { FastifyInstance } from 'fastify';
import { generateInvoiceSchema, RoutingKeys } from '@sbs/contracts';
import { parseInput } from '../../shared/errors';
import { publishEvent } from '../../shared/messaging/publisher';
import { invoicesService } from './invoices.service';

export async function invoiceRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  app.get('/invoices', async (req) => {
    const q = req.query as { limit?: string; offset?: string; subscriptionId?: string };
    const limit = Math.min(Number(q.limit ?? 50), 100);
    const offset = Math.max(Number(q.offset ?? 0), 0);
    return invoicesService.list(limit, offset, q.subscriptionId);
  });

  app.get('/invoices/:id', async (req) => {
    const { id } = req.params as { id: string };
    return invoicesService.get(id);
  });

  app.post('/invoices', async (req, reply) => {
    const input = parseInput(generateInvoiceSchema, req.body);
    const created = await invoicesService.generate(input, req.user.sub);
    void publishEvent(
      RoutingKeys.InvoiceCreated,
      {
        invoiceId: created.id,
        subscriptionId: created.subscriptionId,
        customerId: created.customerId,
        amount: created.amount,
      },
      { correlationId: req.id, requestId: req.id },
    );
    reply.code(201);
    return created;
  });
}

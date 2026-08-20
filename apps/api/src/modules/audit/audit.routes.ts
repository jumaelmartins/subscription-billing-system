import type { FastifyInstance } from 'fastify';
import { listAudit } from './audit.service';

export async function auditRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  app.get('/audit', async (req) => {
    const q = req.query as { limit?: string; offset?: string };
    const limit = Math.min(Number(q.limit ?? 50), 100);
    const offset = Math.max(Number(q.offset ?? 0), 0);
    return listAudit(limit, offset);
  });
}

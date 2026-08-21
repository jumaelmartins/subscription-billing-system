import type { FastifyInstance } from 'fastify';
import { getSummary } from './stats.service';

export async function statsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  app.get('/stats/summary', async () => getSummary());
}

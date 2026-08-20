import type { FastifyInstance } from 'fastify';
import type { HealthResponse } from '@sbs/contracts';
import { pingDatabase } from '../../shared/database/pool';
import { getBrokerConnection, isBrokerConnected } from '../../shared/messaging/connection';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_req, reply) => {
    // Ensure a connection attempt has been kicked off.
    getBrokerConnection();

    const dbUp = await pingDatabase();
    const brokerUp = isBrokerConnected();

    const body: HealthResponse = {
      status: dbUp && brokerUp ? 'ok' : 'degraded',
      uptimeSeconds: Math.round(process.uptime()),
      checks: {
        database: dbUp ? 'up' : 'down',
        broker: brokerUp ? 'up' : 'down',
      },
    };

    reply.code(body.status === 'ok' ? 200 : 503);
    return body;
  });
}

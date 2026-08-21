import { createServer, type Server } from 'node:http';
import { collectDefaultMetrics, Counter, Registry } from 'prom-client';
import { logger } from './logger';

export const registry = new Registry();
collectDefaultMetrics({ register: registry });

export const messagesProcessed = new Counter({
  name: 'worker_messages_processed_total',
  help: 'Messages successfully processed by a consumer',
  labelNames: ['consumer'] as const,
  registers: [registry],
});

export const messagesFailed = new Counter({
  name: 'worker_messages_failed_total',
  help: 'Messages that failed processing and were dead-lettered',
  labelNames: ['consumer'] as const,
  registers: [registry],
});

/** Minimal HTTP server exposing /metrics (Prometheus) and /health for the worker. */
export function startMetricsServer(port: number): Server {
  const server = createServer((req, res) => {
    if (req.url === '/metrics') {
      registry
        .metrics()
        .then((body) => {
          res.setHeader('content-type', registry.contentType);
          res.end(body);
        })
        .catch(() => {
          res.statusCode = 500;
          res.end();
        });
    } else if (req.url === '/health') {
      res.statusCode = 200;
      res.end('ok');
    } else {
      res.statusCode = 404;
      res.end();
    }
  });
  server.listen(port, () => logger.info({ port }, 'metrics server listening'));
  return server;
}

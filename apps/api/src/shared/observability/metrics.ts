import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

export const registry = new Registry();
collectDefaultMetrics({ register: registry });

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests handled by the API',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

export const webhooksReceivedTotal = new Counter({
  name: 'webhooks_received_total',
  help: 'Total webhooks received at the intake endpoint',
  registers: [registry],
});

export const webhooksDuplicateTotal = new Counter({
  name: 'webhooks_duplicate_total',
  help: 'Webhooks ignored as duplicates by the idempotency key',
  registers: [registry],
});

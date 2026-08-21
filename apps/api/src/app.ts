import { randomUUID } from 'node:crypto';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, {
  type FastifyError,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify';
import { env } from './config/env';
import { AppError } from './shared/errors';
import { logger } from './shared/logger';
import { authRoutes } from './modules/auth/auth.routes';
import { auditRoutes } from './modules/audit/audit.routes';
import { customerRoutes } from './modules/customers/customers.routes';
import { closeBroker } from './shared/messaging/connection';
import { healthRoutes } from './modules/health/health.routes';
import { invoiceRoutes } from './modules/invoices/invoices.routes';
import { planRoutes } from './modules/plans/plans.routes';
import { subscriptionRoutes } from './modules/subscriptions/subscriptions.routes';
import { webhookRoutes } from './modules/webhooks/webhooks.routes';
import { httpRequestDuration, httpRequestsTotal, registry } from './shared/observability/metrics';

export async function buildApp() {
  const app = Fastify({
    loggerInstance: logger,
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
  });
  await app.register(cookie);
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: 'token', signed: false },
  });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  await app.register(swagger, {
    openapi: {
      info: { title: 'Subscription Billing API', version: '0.1.0' },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.decorate(
    'authenticate',
    async function (req: FastifyRequest, reply: FastifyReply): Promise<void> {
      try {
        await req.jwtVerify();
      } catch {
        await reply.code(401).send({ error: 'unauthorized' });
      }
    },
  );

  app.setErrorHandler((error: FastifyError, req, reply) => {
    req.log.error({ err: error }, 'request error');
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({ error: error.code, details: error.details });
    }
    const status = error.statusCode ?? 500;
    return reply
      .code(status)
      .send({ error: status >= 500 ? 'internal_error' : (error.message ?? 'error') });
  });

  // Record Prometheus metrics for every response.
  app.addHook('onResponse', async (req, reply) => {
    const route = req.routeOptions?.url ?? req.url;
    const labels = { method: req.method, route, status_code: String(reply.statusCode) };
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, reply.elapsedTime / 1000);
  });

  app.get('/metrics', async (_req, reply) => {
    reply.header('content-type', registry.contentType);
    return registry.metrics();
  });

  // Tear down the broker connection when the app closes (keeps tests clean).
  app.addHook('onClose', async () => {
    await closeBroker();
  });

  await app.register(authRoutes);
  await app.register(customerRoutes);
  await app.register(planRoutes);
  await app.register(subscriptionRoutes);
  await app.register(invoiceRoutes);
  await app.register(webhookRoutes);
  await app.register(auditRoutes);
  await app.register(healthRoutes);

  return app;
}

import { pino, type Logger } from 'pino';
import { env, isDevelopment } from '../config/env';

/**
 * Shared Pino instance. Pretty output in dev; structured JSON everywhere else.
 * Fastify reuses this same instance so app logs and module logs share format.
 */
export const logger: Logger = pino({
  level: env.LOG_LEVEL,
  ...(isDevelopment
    ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } } }
    : {}),
});
